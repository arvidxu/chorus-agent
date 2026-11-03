---
name: chorus-release-ci
description: Use when changing versions, change logs, build configuration, or development-data entry points, and when releasing, changing release workflows or configuration, or writing release notes.
---

## Releases

Read and follow this section when changing versions, changelogs, build configuration, or development-data entry points; performing releases; modifying release workflows or configuration; or writing release notes.

Changing CI workflows also falls under [Permissions and security](../chorus-security-design/SKILL.md#permissions-and-security); its CI rules are in [ci-and-schema.md](../chorus-security-design/references/ci-and-schema.md).

### Versions, changelogs, and release artifacts

- Update release versions only through the project's established release process or explicit user requests; do not casually increment versions for ordinary features, fixes, or documentation changes, or treat every edit as a release.
- A fix task alone does not authorize a release; verify the actual version and release basis beforehand.
- If release tools manage versions, do not bypass them with manual edits; if maintainers manage them, follow the corresponding release steps.
- Ordinary changes do not edit [CHANGELOG.md](../../../CHANGELOG.md); the changelog is written when preparing a release.
- Do not fabricate new released versions, dates, or release records for each editing round; do not rewrite historical behavior in published records.
- When errors genuinely need correction, note errata through the maintenance process rather than presenting subsequent changes as content already present in the original version.

- Exclude mock data, fixtures, test files, and benchmark materials used only for development or testing from production release artifacts. After modifying development-data entry points or build configuration, inspect actual release artifacts and production startup paths to confirm that development data is not included and development mocks are not started; successful development-mode operation does not replace this check.

### Release entry point and checks

To release, set the version in [product.conf.json](../../../product.conf.json), add a nonempty `## <version>` section to [CHANGELOG.md](../../../CHANGELOG.md), commit it to the default branch, and push a `<version>` tag (a bare version such as `1.2.3`, without a `v` prefix) with authorization; [.github/workflows/build.yml](../../../.github/workflows/build.yml) builds and publishes.

- The `<version>` tag is the only release entry; do not add other tag forms, release workflows, or per-artifact tags.
- Desktop and mobile share one sequence of version numbers: a tag releases each platform whose version equals it, and each number is released once.
- Prereleases (a SemVer suffix such as `0.1.0-beta.1`) are desktop only and are never marked latest or sent to app stores; `versions.mobile` is always `x.y.z`, and store build numbers only increase.
- A failed signing step stops the release; mobile publishes only signed packages, and uploads to app stores only after the GitHub release is published.
- A published release is never rewritten. The releases repository uses `RELEASES_TOKEN` limited to its contents and is never force-pushed.

- User-facing release notes describe user-visible fixes or changes, not internal implementation details; explicitly state when there are no user-facing changes.
- Before release, required checks must pass unless the user explicitly accepts identified failures as exceptions; failures of security checks such as secret scanning, signing, notarization, and provenance do not qualify for this exception.
- Report the version, actual passed, failed, and skipped counts, and incomplete coverage; some passing cases do not establish release acceptance.
- Preserve branch and tag protection and trusted publishing (OIDC) in release processes, attach provenance to npm packages when the repository is public, and do not substitute long-lived tokens where trusted publishing is available (the releases repository has no trusted publishing and uses the fine-grained token above).
- Changes to release workflows and configuration require code-owner review.
