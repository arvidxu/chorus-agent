// Uploads to Google Play and App Store Connect.
import { createSign } from 'node:crypto'
import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import {
  product,
  env,
  signingDir,
  summary,
  mask,
  run,
  decodeBase64,
  writeSecretFile,
  filesIn,
  onlyFile,
  setting,
  isPlayStatus,
  isPositive,
  isText,
} from './shared.mjs'

// Sends the signed AAB to Google Play review through the Developer API itself, so no third-party
// action receives the service account key: https://developers.google.com/android-publisher/edits
export async function googlePlay(filesDir) {
  const bundles = filesIn(filesDir, '.aab').filter((name) => !name.endsWith('-test.aab'))
  if (bundles.length === 0) {
    return summary('Google Play upload skipped: this run has no signed AAB.')
  }
  if (bundles.length > 1) {
    throw new Error(`Expected one signed AAB, found ${bundles.length}`)
  }
  if (!env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64) {
    return summary('Google Play upload skipped: missing GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64.')
  }
  let credentials
  try {
    credentials = JSON.parse(decodeBase64('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64'))
  } catch {
    credentials = undefined
  }
  if (
    credentials?.type !== 'service_account' ||
    !credentials.client_email ||
    !credentials.private_key
  ) {
    throw new Error('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64 must be a service account JSON key')
  }
  for (const value of Object.values(credentials)) {
    if (typeof value === 'string' && value) {
      mask(value)
    }
  }
  const track = setting('googlePlay.track', isText)
  const api = 'https://androidpublisher.googleapis.com'
  const timeoutMinutes = setting('googlePlay.requestTimeoutMinutes', isPositive)
  const timeoutSignal = () => AbortSignal.timeout(timeoutMinutes * 60 * 1000)
  const request = async (description, url, init) => {
    const response = await fetch(url, { ...init, signal: timeoutSignal() })
    if (!response.ok) {
      throw new Error(
        `Google Play ${description} failed with HTTP ${response.status}: ${await response.text()}`,
      )
    }
    return response
  }

  const now = Math.floor(Date.now() / 1000)
  const tokenUrl = credentials.token_uri ?? 'https://oauth2.googleapis.com/token'
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
  const header = encode({ alg: 'RS256', typ: 'JWT', kid: credentials.private_key_id })
  const claims = encode({
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: tokenUrl,
    iat: now,
    exp: now + 3600,
  })
  const signature = createSign('RSA-SHA256')
    .update(`${header}.${claims}`)
    .sign(credentials.private_key, 'base64url')
  const { access_token: token } = await (
    await request('authentication', tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: `${header}.${claims}.${signature}`,
      }),
    })
  ).json()
  mask(token)
  const authorization = { Authorization: `Bearer ${token}` }
  const appPath = `applications/${encodeURIComponent(product.appId)}`
  const edit = await (
    await request('edit creation', `${api}/androidpublisher/v3/${appPath}/edits`, {
      method: 'POST',
      headers: authorization,
    })
  ).json()
  const editPath = `${appPath}/edits/${encodeURIComponent(edit.id)}`
  const bundlePath = join(filesDir, bundles[0])
  // Resumable upload: the first request opens a session, the second sends the bundle.
  const session = await request(
    'upload session',
    `${api}/upload/androidpublisher/v3/${editPath}/bundles?uploadType=resumable`,
    {
      method: 'POST',
      headers: {
        ...authorization,
        'X-Upload-Content-Type': 'application/octet-stream',
        'X-Upload-Content-Length': String(statSync(bundlePath).size),
      },
    },
  )
  const uploadUrl = session.headers.get('location')
  if (!uploadUrl) {
    throw new Error('Google Play did not return an upload address')
  }
  const bundle = await (
    await request('bundle upload', uploadUrl, {
      method: 'PUT',
      headers: { ...authorization, 'Content-Type': 'application/octet-stream' },
      body: readFileSync(bundlePath),
    })
  ).json()
  await request('track update', `${api}/androidpublisher/v3/${editPath}/tracks/${track}`, {
    method: 'PUT',
    headers: { ...authorization, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      track,
      releases: [
        {
          name: `${product.name} ${product.versions.mobile}`,
          versionCodes: [String(bundle.versionCode)],
          status: setting('googlePlay.status', isPlayStatus),
        },
      ],
    }),
  })
  await request(
    'edit commit',
    `${api}/androidpublisher/v3/${editPath}:commit?changesNotSentForReview=false`,
    { method: 'POST', headers: authorization },
  )
  summary(
    `Google Play: uploaded ${bundles[0]} (version code ${bundle.versionCode}) to ${track} and sent it for review.`,
  )
}

// Uploads the signed IPA to App Store Connect; submitting it for review stays a manual step.
export function appStore(filesDir) {
  if (filesIn(filesDir, '.ipa').length === 0) {
    return summary('App Store Connect upload skipped: this run has no signed IPA.')
  }
  for (const name of [
    'APP_STORE_CONNECT_API_KEY_BASE64',
    'APP_STORE_CONNECT_KEY_ID',
    'APP_STORE_CONNECT_ISSUER_ID',
  ]) {
    if (!env[name]) {
      return summary(`App Store Connect upload skipped: missing ${name}.`)
    }
  }
  const keyId = env.APP_STORE_CONNECT_KEY_ID
  if (!/^[A-Za-z0-9]+$/.test(keyId)) {
    throw new Error('APP_STORE_CONNECT_KEY_ID must be an Apple API Key ID')
  }
  // altool looks for AuthKey_<id>.p8 in API_PRIVATE_KEYS_DIR.
  writeSecretFile(
    join(signingDir(), `AuthKey_${keyId}.p8`),
    decodeBase64('APP_STORE_CONNECT_API_KEY_BASE64'),
  )
  // The upload returns once the package is transferred; App Store Connect reports processing
  // itself, so the macOS machine does not wait for it.
  run(
    'xcrun',
    [
      'altool',
      '--upload-package',
      onlyFile(filesDir, '.ipa'),
      '--api-key',
      keyId,
      '--api-issuer',
      env.APP_STORE_CONNECT_ISSUER_ID,
    ],
    { env: { ...env, API_PRIVATE_KEYS_DIR: signingDir() } },
  )
}
