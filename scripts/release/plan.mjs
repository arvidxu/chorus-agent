// Steps that run before any build: the tag check, the release plan, the release settings check, and
// the machine labels for the Test and lint workflow.
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import {
  root,
  product,
  env,
  tag,
  separateReleases,
  releasesRepository,
  systems,
  setOutput,
  summary,
  run,
  capture,
  setting,
  isText,
  isPositive,
  isTextList,
  isPlayStatus,
  runnerLabels,
  releaseVersion,
  viewRelease,
} from './shared.mjs'
import { releaseNotes } from './publish.mjs'

// Gives the Test and lint workflow the machines the release uses.
export function writeRunners() {
  setOutput('runners', JSON.stringify(runnerLabels()))
}

// The release jobs receive signing and publishing secrets, so a tag releases only a commit that is
// already on the default branch.
export function checkTag() {
  const event = JSON.parse(readFileSync(env.GITHUB_EVENT_PATH, 'utf8'))
  const branch = event.repository?.default_branch
  if (!isText(branch)) {
    throw new Error('The push event does not name the default branch')
  }
  const result = spawnSync('git', [
    '-C',
    root,
    'merge-base',
    '--is-ancestor',
    env.GITHUB_SHA,
    `origin/${branch}`,
  ])
  if (result.status !== 0) {
    throw new Error(
      `Tag ${tag} points to ${env.GITHUB_SHA}, which is not on ${branch}. Nothing was built; merge the change into ${branch}, then tag a commit on ${branch}.`,
    )
  }
}

// Decides what this tag builds, and checks every setting before any machine starts building.
export function plan() {
  const version = releaseVersion()
  const known = ['mac', 'windows', 'linux', 'android', 'ios']
  const switches = setting(
    'platforms',
    (value) =>
      value &&
      Object.keys(value).length === known.length &&
      known.every((name) => typeof value[name] === 'boolean'),
  )
  const runners = runnerLabels()
  const timeoutMinutes = setting(
    'timeoutMinutes',
    (value) =>
      value &&
      ['build', 'release', 'googlePlay', 'appStore'].every((name) => isPositive(value[name])),
  )
  const artifactRetentionDays = setting('artifactRetentionDays', isPositive)
  setting('retryAttempts', isPositive)
  setting(
    'desktop.scripts',
    (value) => value && Object.keys(systems).every((name) => isText(value[name])),
  )
  setting('desktop.checkStartupSeconds', isPositive)
  setting('desktop.checkStopSeconds', isPositive)
  setting('mobile.androidArchitectures', isTextList)
  const javaVersion = setting('mobile.javaVersion', isPositive)
  const javaDistribution = setting('mobile.javaDistribution', isText)
  setting('googlePlay.track', isText)
  setting('googlePlay.status', isPlayStatus)
  setting('googlePlay.requestTimeoutMinutes', isPositive)

  // Prereleases (such as 0.2.0-beta.1) are for the desktop app only; the mobile app always ships
  // stable versions.
  if (!/^\d+\.\d+\.\d+$/.test(product.versions.mobile)) {
    throw new Error(
      `versions.mobile (${product.versions.mobile}) in product.conf.json must be a stable version like 1.2.3; prereleases are desktop only. Nothing was built.`,
    )
  }
  // Each part whose version equals the tag version is built; the other is skipped.
  const desktopReleased = product.versions.desktop === version
  const mobileReleased = product.versions.mobile === version
  if (!desktopReleased && !mobileReleased) {
    throw new Error(
      `Tag ${version} matches neither versions.desktop (${product.versions.desktop}) nor versions.mobile (${product.versions.mobile}) in product.conf.json. Nothing was built.`,
    )
  }
  releaseNotes()
  // Desktop and mobile packages build on separate machines, so they build at the same time.
  const builds = Object.entries(systems)
    .flatMap(([name, { desktop, mobile }]) => [
      desktopReleased && switches[desktop] && { name, os: runners[name], desktop, mobile: '' },
      mobile &&
        mobileReleased &&
        switches[mobile] && { name: mobile, os: runners[name], desktop: '', mobile },
    ])
    .filter(Boolean)
  if (builds.length === 0) {
    throw new Error(`Every platform released by ${version} is turned off in release.platforms.`)
  }
  setOutput('builds', JSON.stringify(builds))
  setOutput(
    'settings',
    JSON.stringify({
      runners,
      timeoutMinutes,
      artifactRetentionDays,
      javaVersion,
      javaDistribution,
    }),
  )
  // The mobile version is always stable, so every mobile release goes to the store of each platform
  // that is turned on.
  setOutput('googlePlay', mobileReleased && switches.android)
  setOutput('appStore', mobileReleased && switches.ios)
  summary(
    `Release ${version}: ${builds.map(({ name, desktop, mobile }) => `${name} (${[desktop && 'desktop', mobile].filter(Boolean).join(', ')})`).join('; ')}.`,
  )
}

// Runs before any build, so a wrong release setting fails without building anything.
export function check() {
  if (separateReleases) {
    if (env.RELEASES_TOKEN_SET !== 'true') {
      throw new Error(
        'RELEASES_REPOSITORY is set but RELEASES_TOKEN is not. Add RELEASES_TOKEN, or clear RELEASES_REPOSITORY to release in this repository.',
      )
    }
    if (!/^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/.test(releasesRepository)) {
      throw new Error('RELEASES_REPOSITORY must be in the form owner/name')
    }
  }
  if (viewRelease()?.isDraft === false) {
    throw new Error(`Release ${tag} is already published in ${releasesRepository}`)
  }
  if (separateReleases) {
    checkReleasesWriteAccess()
  }
}

// Reading releases works with a read-only token, so a dry-run push checks that RELEASES_TOKEN can
// also write. A dry run sends nothing; GitHub only allows it with write access.
function checkReleasesWriteAccess() {
  const dir = join(env.RUNNER_TEMP, 'releases-write-check')
  const git = (...args) => capture('git', ['-C', dir, ...args])
  mkdirSync(dir, { recursive: true })
  run('gh', ['auth', 'setup-git'])
  git('init', '--quiet')
  git(
    '-c',
    'user.name=github-actions[bot]',
    '-c',
    'user.email=41898282+github-actions[bot]@users.noreply.github.com',
    'commit',
    '--allow-empty',
    '--quiet',
    '-m',
    'Write access check',
  )
  try {
    git(
      'push',
      '--dry-run',
      `https://github.com/${releasesRepository}.git`,
      'HEAD:refs/heads/release-write-check',
    )
  } catch (error) {
    throw new Error(
      `RELEASES_TOKEN cannot write to ${releasesRepository}. Give it Contents: Read and write on that repository, then push the tag again: ${error.stderr}`,
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}
