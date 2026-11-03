// Builds the Android and iOS apps, signed when the signing secrets are present.
import { execFileSync, spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, join } from 'node:path'
import {
  root,
  mobileDir,
  product,
  env,
  signingDir,
  outputDir,
  setOutput,
  setEnv,
  summary,
  mask,
  hasAll,
  run,
  capture,
  decodeBase64,
  writeSecretFile,
  onlyFile,
  moveInto,
  setting,
  isPositive,
  isTextList,
} from './shared.mjs'

// Like Firefox for Android: the build number counts minutes from a fixed date to the tagged
// commit, so it grows with every later tag and a rerun of the same tag keeps it. Never move the
// date later: the stores reject a build number smaller than one already uploaded.
const buildNumberEpoch = Date.parse('2026-01-01T00:00:00Z')

function buildNumber() {
  const committed = Number(capture('git', ['-C', root, 'log', '-1', '--format=%ct']).trim()) * 1000
  const minutes = Math.floor((committed - buildNumberEpoch) / 60_000)
  if (!(minutes >= 1)) {
    throw new RangeError('The tagged commit is older than the build number epoch')
  }
  return String(minutes)
}

function prepareAndroidSigning() {
  const signed = hasAll(
    'ANDROID_KEYSTORE_BASE64',
    'ANDROID_KEYSTORE_PASSWORD',
    'ANDROID_KEY_ALIAS',
    'ANDROID_KEY_PASSWORD',
  )
  if (signed) {
    writeSecretFile(join(signingDir(), 'android.jks'), decodeBase64('ANDROID_KEYSTORE_BASE64'))
  } else {
    summary(
      'Android test signing enabled: missing signing secrets. The test APK and AAB stay in the run artifacts and are not published.',
    )
  }
  return signed
}

// Installs the iOS distribution certificate and App Store profile in a temporary keychain.
function prepareIosSigning() {
  if (
    !hasAll('IOS_CERTIFICATE_BASE64', 'IOS_CERTIFICATE_PASSWORD', 'IOS_PROVISIONING_PROFILE_BASE64')
  ) {
    summary(
      'iOS signing and App Store upload skipped: missing signing secrets. An unsigned Xcode archive is kept.',
    )
    return false
  }
  const dir = signingDir()
  const certificate = join(dir, 'ios.p12')
  const profile = join(dir, 'ios.mobileprovision')
  const profilePlist = join(dir, 'ios.mobileprovision.plist')
  writeSecretFile(certificate, decodeBase64('IOS_CERTIFICATE_BASE64'))
  writeSecretFile(profile, decodeBase64('IOS_PROVISIONING_PROFILE_BASE64'))
  execFileSync('security', ['cms', '-D', '-i', profile, '-o', profilePlist], { stdio: 'ignore' })
  // Arrays report their length; missing keys return undefined.
  const read = (keyPath) => {
    const result = spawnSync('plutil', ['-extract', keyPath, 'raw', '-o', '-', profilePlist], {
      encoding: 'utf8',
    })
    return result.status === 0 ? result.stdout.trim() : undefined
  }
  if (
    read('Entitlements.application-identifier') !==
    `${read('ApplicationIdentifierPrefix.0')}.${product.appId}`
  ) {
    throw new Error(`The iOS provisioning profile is not for ${product.appId}`)
  }
  if (
    read('Entitlements.get-task-allow') === 'true' ||
    Number(read('ProvisionedDevices') ?? 0) > 0 ||
    read('ProvisionsAllDevices') === 'true'
  ) {
    throw new Error('An App Store Connect distribution provisioning profile is required')
  }
  const teamId = read('TeamIdentifier.0') ?? ''
  const profileId = read('UUID') ?? ''
  for (const value of [teamId, profileId, read('Name') ?? '']) {
    mask(value)
  }

  // Xcode 16 and later read profiles from UserData; cleanup removes the installed copy.
  const profiles = join(homedir(), 'Library/Developer/Xcode/UserData/Provisioning Profiles')
  mkdirSync(profiles, { recursive: true })
  const installedProfile = join(profiles, `${profileId}.mobileprovision`)
  copyFileSync(profile, installedProfile)
  setEnv('CI_IOS_PROFILE_PATH', installedProfile)
  // withCiSigning.js reads these during expo prebuild.
  Object.assign(env, { CI_IOS_TEAM_ID: teamId, CI_IOS_PROFILE_UUID: profileId })

  // security import takes the password only as an argument, so the .p12 is re-encrypted with a
  // one-time password; the real password and private key reach openssl only by env and pipe.
  const importPassword = randomBytes(32).toString('hex')
  mask(importPassword)
  const chainFile = join(dir, 'ios-certificates.pem')
  const importable = join(dir, 'ios-import.p12')
  const pkcs12 = (args, input) =>
    spawnSync('/usr/bin/openssl', ['pkcs12', ...args], {
      input,
      stdio: ['pipe', 'pipe', 'ignore'],
      env: { ...env, IOS_IMPORT_PASSWORD: importPassword },
    })
  const decrypt = ['-in', certificate, '-passin', 'env:IOS_CERTIFICATE_PASSWORD']
  const chain = pkcs12([...decrypt, '-nokeys', '-out', chainFile])
  const privateKey = pkcs12([...decrypt, '-nocerts', '-nodes'])
  const isReencrypted =
    chain.status === 0 &&
    privateKey.status === 0 &&
    pkcs12(
      [
        '-export',
        '-in',
        chainFile,
        '-inkey',
        '/dev/stdin',
        '-out',
        importable,
        '-passout',
        'env:IOS_IMPORT_PASSWORD',
        '-keypbe',
        'PBE-SHA1-3DES',
        '-certpbe',
        'PBE-SHA1-3DES',
      ],
      privateKey.stdout,
    ).status === 0
  if (!isReencrypted) {
    throw new Error(
      'The iOS certificate could not be read with IOS_CERTIFICATE_PASSWORD; check that it is an Apple Distribution .p12 with its private key',
    )
  }

  const keychain = join(dir, 'ios.keychain-db')
  const password = randomBytes(32).toString('hex')
  mask(password)
  // codesign only finds identities in keychains on the user search list, so the temporary keychain
  // goes in front of the existing ones, which stay usable; cleanup restores the original list.
  const previousKeychains = capture('security', ['list-keychains', '-d', 'user'])
    .split('\n')
    .map((line) => line.trim().replace(/^"|"$/g, ''))
    .filter(Boolean)
  setEnv('CI_IOS_PREVIOUS_KEYCHAINS', JSON.stringify(previousKeychains))
  const security = [
    ['create-keychain', '-p', password, keychain],
    // The keychain stays unlocked for as long as the build job may run.
    [
      'set-keychain-settings',
      '-lut',
      String(setting('timeoutMinutes.build', isPositive) * 60),
      keychain,
    ],
    ['unlock-keychain', '-p', password, keychain],
    [
      'import',
      importable,
      '-P',
      importPassword,
      '-A',
      '-t',
      'cert',
      '-f',
      'pkcs12',
      '-k',
      keychain,
    ],
    ['set-key-partition-list', '-S', 'apple-tool:,apple:', '-k', password, keychain],
    ['list-keychains', '-d', 'user', '-s', keychain, ...previousKeychains],
  ]
  for (const args of security) {
    if (spawnSync('security', args, { stdio: 'ignore' }).status !== 0) {
      throw new Error(`iOS signing setup failed at security ${args[0]}`)
    }
  }

  const escapeXml = (value) =>
    value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  writeFileSync(
    join(dir, 'ExportOptions.plist'),
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>manageAppVersionAndBuildNumber</key><false/>
  <key>method</key><string>app-store-connect</string>
  <key>provisioningProfiles</key>
  <dict><key>${escapeXml(product.appId)}</key><string>${escapeXml(profileId)}</string></dict>
  <key>signingCertificate</key><string>Apple Distribution</string>
  <key>signingStyle</key><string>manual</string>
  <key>teamID</key><string>${escapeXml(teamId)}</string>
</dict>
</plist>
`,
  )
  return true
}

function buildAndroid(signed, prefix) {
  const architectures = setting('mobile.androidArchitectures', isTextList)
  run(
    './gradlew',
    [
      '--no-daemon',
      '--init-script',
      join(root, 'scripts/release/android-signing.gradle'),
      `-PreactNativeArchitectures=${architectures.join(',')}`,
      ':app:assembleRelease',
      ':app:bundleRelease',
    ],
    {
      cwd: join(mobileDir, 'android'),
      env: {
        ...env,
        ANDROID_SIGNING_ENABLED: String(signed),
        ANDROID_KEYSTORE_PATH: join(signingDir(), 'android.jks'),
      },
    },
  )
  const outputs = join(mobileDir, 'android/app/build/outputs')
  const apk = join(outputs, 'apk/release/app-release.apk')
  const aab = join(outputs, 'bundle/release/app-release.aab')
  if (signed) {
    moveInto('mobile', apk, `${prefix}-universal.apk`)
    moveInto('store', aab, `${prefix}.aab`)
  } else {
    moveInto('test', apk, `${prefix}-universal-test.apk`)
    moveInto('test', aab, `${prefix}-test.aab`)
  }
}

function buildIos(signed, prefix) {
  run('pod', ['install', '--project-directory=ios'], { cwd: mobileDir })
  const workspace = onlyFile(join(mobileDir, 'ios'), '.xcworkspace')
  const archive = join(env.RUNNER_TEMP, 'mobile.xcarchive')
  run(
    'xcodebuild',
    [
      '-workspace',
      workspace,
      '-scheme',
      basename(workspace, '.xcworkspace'),
      '-configuration',
      'Release',
      '-destination',
      'generic/platform=iOS',
      '-archivePath',
      archive,
      'archive',
      ...(signed ? [] : ['CODE_SIGNING_ALLOWED=NO']),
      '-quiet',
    ],
    { cwd: mobileDir },
  )
  if (!signed) {
    mkdirSync(outputDir('test'), { recursive: true })
    run('ditto', [
      '-c',
      '-k',
      '--keepParent',
      archive,
      join(outputDir('test'), `${prefix}-unsigned.xcarchive.zip`),
    ])
    return
  }
  const exportDir = join(env.RUNNER_TEMP, 'mobile-export')
  run('xcodebuild', [
    '-exportArchive',
    '-archivePath',
    archive,
    '-exportOptionsPlist',
    join(signingDir(), 'ExportOptions.plist'),
    '-exportPath',
    exportDir,
    '-quiet',
  ])
  moveInto('store', onlyFile(exportDir, '.ipa'), `${prefix}.ipa`)
}

export function mobileBuild(platform) {
  if (!['android', 'ios'].includes(platform)) {
    throw new Error(`Unknown mobile platform: ${platform}`)
  }
  // app.config.js reads the build number during expo prebuild.
  env.MOBILE_BUILD_NUMBER = buildNumber()
  summary(`Mobile build number: ${env.MOBILE_BUILD_NUMBER}.`)
  const signed = platform === 'android' ? prepareAndroidSigning() : prepareIosSigning()
  setOutput('signed', signed)
  run('pnpm', ['exec', 'expo', 'prebuild', '--platform', platform, '--no-install'], {
    cwd: mobileDir,
  })
  const prefix = `${product.name}-${product.versions.mobile}-${platform}`
  if (platform === 'android') {
    buildAndroid(signed, prefix)
  } else {
    buildIos(signed, prefix)
  }
}
