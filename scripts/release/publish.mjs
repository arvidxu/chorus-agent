// Release notes, releases.json, and publishing the GitHub release.
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  root,
  product,
  env,
  tag,
  separateReleases,
  releasesRepository,
  summary,
  setOutput,
  run,
  capture,
  releaseVersion,
  isPrerelease,
  downloadFormats,
  installerPattern,
  isReleaseFile,
  isUpdateFile,
  viewRelease,
} from './shared.mjs'

// The platforms of the download table, one row per architecture with its formats side by side.
const platforms = [
  {
    label: 'macOS',
    marker: '-macos-',
    architectures: [
      ['Apple silicon (arm64)', /-macos-arm64\./],
      ['Intel (x64)', /-macos-x64\./],
    ],
  },
  {
    label: 'Windows',
    marker: '-windows-',
    architectures: [
      ['x64', /-windows-x64-/],
      ['arm64', /-windows-arm64-/],
    ],
  },
  {
    label: 'Linux',
    marker: '-linux-',
    architectures: [
      ['x64', /-linux-(?:x86_64|amd64)\./],
      ['arm64', /-linux-(?:arm64|aarch64)\./],
    ],
  },
  {
    label: 'Android',
    marker: '-android-',
    architectures: [['Universal', /-android-universal\./]],
  },
]

// latestReleases maps a platform label to the latest earlier release that has its files.
export function releaseNotes(
  files = [],
  latestReleases = {},
  changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8'),
) {
  const version = releaseVersion()
  const sections = changelog.split(/^## /m)
  const matches = sections
    .slice(1)
    .filter((section) => section.split(/\r?\n/, 1)[0].trim() === version)
  if (matches.length !== 1) {
    throw new Error(`CHANGELOG.md must contain exactly one "## ${version}" section`)
  }
  const notes = matches[0].split(/\r?\n/).slice(1).join('\n').trim()
  if (!notes.split(/\r?\n/).some((line) => line.trim() && !line.trim().startsWith('#'))) {
    throw new Error(`CHANGELOG.md has no release notes for ${version}`)
  }
  if (files.length === 0) {
    return notes
  }

  const server = env.GITHUB_SERVER_URL ?? 'https://github.com'
  const downloadBase = `${server}/${releasesRepository}/releases/download/${encodeURIComponent(tag)}`
  const listed = new Set()
  const rows = platforms.flatMap(({ label, architectures }) =>
    architectures.flatMap(([architectureLabel, pattern]) => {
      const links = downloadFormats.flatMap(([extension, formatLabel]) =>
        files
          .filter((name) => pattern.test(name) && name.endsWith(extension))
          .map((name) => {
            listed.add(name)
            return `[${formatLabel}](${downloadBase}/${encodeURIComponent(name)})`
          }),
      )
      return links.length > 0 ? [`| ${label} | ${architectureLabel} | ${links.join(' · ')} |`] : []
    }),
  )
  const unlisted = files.filter((name) => !listed.has(name))
  if (unlisted.length > 0) {
    throw new Error(`No download table row for: ${unlisted.join(', ')}`)
  }
  // A platform this release skips links to the latest earlier release that has it, so its users
  // still find a download; a platform never released has no row.
  const notIncluded = platforms
    .filter(
      ({ label, marker }) => latestReleases[label] && !files.some((name) => name.includes(marker)),
    )
    .map(
      ({ label }) =>
        `| ${label} | — | Not in this release; latest is [${latestReleases[label]}](${server}/${releasesRepository}/releases/tag/${encodeURIComponent(latestReleases[label])}) |`,
    )
  return [
    `## Downloads (${tag})`,
    '',
    '| Platform | Architecture | Download |',
    '| --- | --- | --- |',
    ...rows,
    ...notIncluded,
    '',
    '<details>',
    '<summary>Release Notes</summary>',
    '',
    notes,
    '',
    '</details>',
  ].join('\n')
}

// SemVer precedence, so releases.json never replaces a newer version with an older one.
export function compareVersions(left, right) {
  const parse = (version) => {
    const [core, prerelease] = version.split('+', 1)[0].split(/-(.*)/s)
    return { core: core.split('.').map(Number), prerelease: prerelease?.split('.') ?? [] }
  }
  const a = parse(left)
  const b = parse(right)
  for (let index = 0; index < 3; index += 1) {
    if (a.core[index] !== b.core[index]) {
      return a.core[index] - b.core[index]
    }
  }
  if (a.prerelease.length === 0 || b.prerelease.length === 0) {
    return b.prerelease.length - a.prerelease.length
  }
  for (let index = 0; index < Math.max(a.prerelease.length, b.prerelease.length); index += 1) {
    const [x, y] = [a.prerelease[index], b.prerelease[index]]
    if (x === y) {
      continue
    }
    if (x === undefined || y === undefined) {
      return x === undefined ? -1 : 1
    }
    const [isXNumber, isYNumber] = [/^\d+$/.test(x), /^\d+$/.test(y)]
    if (isXNumber && isYNumber) {
      return Number(x) - Number(y)
    }
    if (isXNumber !== isYNumber) {
      return isXNumber ? -1 : 1
    }
    return x < y ? -1 : 1
  }
  return 0
}

// Commits releases.json to the releases repository and returns the commit the tag points at.
// Prereleases are recorded under "prerelease".
function recordRelease(files) {
  const dir = join(env.RUNNER_TEMP, 'releases-repository')
  const git = (...args) => capture('git', ['-C', dir, ...args]).trim()
  run('gh', ['auth', 'setup-git'])
  run('gh', ['repo', 'clone', releasesRepository, dir])
  const branch = capture('gh', [
    'api',
    `repos/${releasesRepository}`,
    '--jq',
    '.default_branch',
  ]).trim()
  git('config', 'user.name', 'github-actions[bot]')
  git('config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com')
  const manifestPath = join(dir, 'releases.json')
  const readManifest = () =>
    existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {}
  // An empty repository has no commits yet; this release makes its first one.
  const isEmpty = git('rev-list', '--all', '--max-count=1') === ''
  if (isEmpty) {
    git('checkout', '-B', branch)
  }

  const released = ['desktop', 'mobile'].filter((part) =>
    part === 'desktop'
      ? files.some((name) => installerPattern().test(name))
      : files.some((name) => name.endsWith('.apk')),
  )
  // A rerun finds the commit that an earlier attempt of this release pushed.
  if (!isEmpty) {
    const pushed = git('log', '-1', '--format=%H', '--fixed-strings', `--grep=Release ${tag} (`)
    if (pushed) {
      return pushed
    }
  }

  const manifest = readManifest()
  const channel = isPrerelease() ? (manifest.prerelease ??= {}) : manifest
  for (const part of released) {
    const version = product.versions[part]
    const recorded = channel[part]?.version
    if (!recorded || compareVersions(version, recorded) > 0) {
      channel[part] = { version, tag }
    }
  }
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  git('add', 'releases.json')
  git('commit', '--allow-empty', '-m', `Release ${tag} (${released.join(' ')})`)
  // A push rejected because someone pushed meanwhile is replayed on top of their commits.
  for (let attempt = 1; ; attempt += 1) {
    try {
      git('push', 'origin', `HEAD:${branch}`)
      break
    } catch (error) {
      if (attempt === 3) {
        throw new Error(`Pushing releases.json failed: ${error.stderr}`)
      }
      git('pull', '--rebase', 'origin', branch)
    }
  }
  return git('rev-parse', 'HEAD')
}

// Only the fields read here: the full list overflows the output limit of capture.
function listReleases() {
  return capture('gh', [
    'api',
    '--paginate',
    `repos/${releasesRepository}/releases?per_page=100`,
    '--jq',
    '.[] | {tag: .tag_name, draft, prerelease, assets: [.assets[].name]}',
  ])
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))
}

// For each platform, the latest earlier stable release in the releases repository that has its files.
export function latestReleasesByPlatform(releases) {
  const latest = {}
  // GitHub lists the newest release first.
  for (const { tag: releaseTag, draft, prerelease, assets } of releases) {
    if (draft || prerelease || releaseTag === tag) {
      continue
    }
    for (const { label, marker } of platforms) {
      latest[label] ??= assets.some((name) => name.includes(marker)) ? releaseTag : undefined
    }
  }
  return latest
}

// The update feed reads the latest release, so a fix to an older line must not take it over.
export const isNewestDesktopRelease = (version, releases) =>
  releases
    .filter(
      ({ draft, prerelease, assets }) =>
        !draft && !prerelease && assets.some((name) => installerPattern().test(name)),
    )
    .every(({ tag: releaseTag }) => compareVersions(version, releaseTag) >= 0)

export function publish(filesDir) {
  const files = existsSync(filesDir) ? readdirSync(filesDir).filter(isReleaseFile).sort() : []
  if (files.length === 0) {
    summary(
      'Nothing to publish: this run built no installer or signed APK, so no release was made.',
    )
    setOutput('published', false)
    return
  }
  const release = viewRelease()
  if (release?.isDraft === false) {
    throw new Error(`Release ${tag} is already published in ${releasesRepository}`)
  }
  const releases = listReleases()
  // The download table lists installers; the update files are for the desktop app.
  const notes = releaseNotes(
    files.filter((name) => !isUpdateFile(name)),
    latestReleasesByPlatform(releases),
  )
  const commit = separateReleases ? recordRelease(files) : undefined
  if (!release) {
    // The source repository already has the pushed tag; the releases repository gets it on the
    // commit that records this release.
    const target = commit ? ['--target', commit] : ['--verify-tag']
    execFileSync(
      'gh',
      [
        'release',
        'create',
        tag,
        '--repo',
        releasesRepository,
        ...target,
        '--title',
        tag,
        '--draft',
        '--notes-file',
        '-',
      ],
      { input: notes, stdio: ['pipe', 'inherit', 'inherit'] },
    )
  }
  run('gh', [
    'release',
    'upload',
    tag,
    ...files.map((name) => join(filesDir, name)),
    '--repo',
    releasesRepository,
    '--clobber',
  ])
  // Only the newest stable release with desktop installers becomes the latest release, so the
  // "latest" download link always finds a desktop installer.
  const hasDesktop = files.some((name) => installerPattern().test(name))
  let flags = ['--latest=false']
  if (isPrerelease()) {
    flags = ['--prerelease']
  } else if (hasDesktop && isNewestDesktopRelease(releaseVersion(), releases)) {
    flags = ['--latest']
  }
  execFileSync(
    'gh',
    [
      'release',
      'edit',
      tag,
      '--repo',
      releasesRepository,
      '--notes-file',
      '-',
      '--draft=false',
      ...flags,
    ],
    { input: notes, stdio: ['pipe', 'inherit', 'inherit'] },
  )
  summary(`Published ${tag} in ${releasesRepository} with ${files.length} files.`)
  setOutput('published', true)
}
