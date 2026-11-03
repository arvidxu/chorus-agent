import { describe, expect, test, vi } from 'vitest'

vi.hoisted(() => {
  process.env.GITHUB_REF_NAME = '1.2.0'
  process.env.GITHUB_REPOSITORY = 'owner/name'
})

const { compareVersions, isNewestDesktopRelease, latestReleasesByPlatform, releaseNotes } =
  await import('../publish.mjs')
const { isReleaseFile, isUpdateFile, releaseVersion } = await import('../shared.mjs')

const changelog = '# Changelog\n\n## 1.2.0\n\n- A change.\n\n## 1.1.0\n\n- An older change.\n'

const release = (tag, assets = ['Chorus-1.0.0-macos-arm64.dmg'], fields = {}) => ({
  tag,
  draft: false,
  prerelease: false,
  assets,
  ...fields,
})

describe('releaseVersion', () => {
  test('reads the version from a bare version tag', () => {
    expect(releaseVersion()).toBe('1.2.0')
  })
})

describe('compareVersions', () => {
  test('orders versions by SemVer precedence', () => {
    const ascending = ['1.0.0-alpha', '1.0.0-alpha.1', '1.0.0-beta.2', '1.0.0-beta.11', '1.0.0']
    for (const [index, version] of ascending.slice(1).entries()) {
      expect(compareVersions(version, ascending[index])).toBeGreaterThan(0)
      expect(compareVersions(ascending[index], version)).toBeLessThan(0)
    }
    expect(compareVersions('1.10.0', '1.9.0')).toBeGreaterThan(0)
  })

  test('ignores build metadata', () => {
    expect(compareVersions('1.0.0+a', '1.0.0+b')).toBe(0)
  })
})

describe('isNewestDesktopRelease', () => {
  test('is true for a version above every desktop release', () => {
    expect(isNewestDesktopRelease('1.2.0', [release('1.1.0')])).toBe(true)
  })

  test('is false for a fix to an older line', () => {
    expect(isNewestDesktopRelease('1.1.1', [release('1.2.0')])).toBe(false)
  })

  test('ignores drafts, prereleases and mobile-only releases', () => {
    const releases = [
      release('2.0.0', ['Chorus-2.0.0-android-universal.apk']),
      release('3.0.0-beta.1', undefined, { prerelease: true }),
      release('4.0.0', undefined, { draft: true }),
    ]
    expect(isNewestDesktopRelease('1.2.0', releases)).toBe(true)
  })
})

describe('latestReleasesByPlatform', () => {
  test('finds the newest stable release of each platform and skips this tag', () => {
    const releases = [
      release('1.2.0'),
      release('1.1.0', ['Chorus-1.1.0-windows-x64-setup.exe']),
      release('1.0.9', ['Chorus-1.0.9-macos-x64.dmg']),
      release('1.0.8', ['Chorus-1.0.8-windows-x64-setup.exe']),
    ]
    expect(latestReleasesByPlatform(releases)).toEqual({
      macOS: '1.0.9',
      Windows: '1.1.0',
      Linux: undefined,
      Android: undefined,
    })
  })
})

describe('releaseNotes', () => {
  test('returns the section of this version when there are no files', () => {
    expect(releaseNotes([], {}, changelog)).toBe('- A change.')
  })

  test('stops when the changelog has no section for this version', () => {
    expect(() => releaseNotes([], {}, '## 1.1.0\n\n- An older change.\n')).toThrow(
      'exactly one "## 1.2.0" section',
    )
  })

  test('stops when the section has no notes', () => {
    expect(() => releaseNotes([], {}, '## 1.2.0\n\n### Application\n')).toThrow('no release notes')
  })

  test('lists each file in the download table', () => {
    const notes = releaseNotes(['Chorus-1.2.0-macos-arm64.dmg'], {}, changelog)
    expect(notes).toContain(
      '| macOS | Apple silicon (arm64) | [DMG](https://github.com/owner/name/releases/download/1.2.0/Chorus-1.2.0-macos-arm64.dmg) |',
    )
  })

  test('links a skipped platform to its latest release', () => {
    const notes = releaseNotes(['Chorus-1.2.0-macos-arm64.dmg'], { Windows: '1.1.0' }, changelog)
    expect(notes).toContain('| Windows | — | Not in this release; latest is [1.1.0]')
  })

  test('stops on a file the table cannot list', () => {
    expect(() => releaseNotes(['Chorus-1.2.0-macos-riscv64.dmg'], {}, changelog)).toThrow(
      'No download table row for: Chorus-1.2.0-macos-riscv64.dmg',
    )
  })
})

describe('release files', () => {
  test('keeps installers, signed APKs and update files', () => {
    for (const name of [
      'Chorus-1.2.0-macos-arm64.dmg',
      'Chorus-1.2.0-windows-x64-portable.exe',
      'Chorus-1.2.0-linux-x86_64.AppImage',
      'Chorus-1.2.0-android-universal.apk',
      'latest-mac.yml',
      'Chorus-1.2.0-macos-arm64.zip.blockmap',
      'Chorus-1.2.0-windows-x64-setup.exe.blockmap',
    ]) {
      expect(isReleaseFile(name), name).toBe(true)
    }
  })

  test('leaves out test builds and blockmaps the updater does not read', () => {
    for (const name of [
      'Chorus-1.2.0-android-universal-test.apk',
      'Chorus-1.2.0-macos-arm64.dmg.blockmap',
      'Chorus-1.2.0-windows-x64-portable.exe.blockmap',
      'builder-debug.yml',
    ]) {
      expect(isReleaseFile(name), name).toBe(false)
    }
  })

  test('tells update files from installers', () => {
    expect(isUpdateFile('latest.yml')).toBe(true)
    expect(isUpdateFile('Chorus-1.2.0-macos-arm64.dmg')).toBe(false)
  })
})
