---
name: chorus-dependencies
description: Use when adding, upgrading or removing dependencies, or changing package manifests, lockfiles, dependency overrides, or install-script permissions.
---

## Dependency management

Read and follow this section before adding, upgrading, or removing dependencies, or modifying package manifests, lockfiles, dependency overrides, or installation-script permissions.

- Before adding a dependency, confirm that existing dependencies or implementations cannot meet the need, explain the choice, and check its license, maintenance status, and size; prefer well-maintained dependencies when they let you remove project-owned code and tests, but do not add a dependency for just a few lines of code.
- Before adding dependencies or upgrading dependency major versions, obtain confirmation under the pause conditions in "Working agreement" in [Working agreement and development process](../chorus-workflow/SKILL.md#working-agreement-and-development-process).
- Add dependencies to the package that actually uses them by running `pnpm --filter <package-name> add <dependency>` at the repository root (for mobile, see [Mobile app (apps/mobile)](../chorus-mobile/SKILL.md#mobile-app-appsmobile)); declare every imported package in the consumer's own `package.json`, without relying on accidental resolution from root `node_modules` or old installations, and do not put dependencies used by only one package in the root [package.json](../../../package.json).
- Do not copy external code with an incompatible license or unknown provenance.
- Query current versions when adding or upgrading dependencies rather than writing version numbers from memory; read the target version's release notes and assess breaking changes before upgrading.
- When outdated dependencies cause type errors, upgrade the dependency rather than deleting, modifying, or downgrading code to work around them, and do not add compatibility branches for unsupported old runtimes.
- Pin external data such as upstream specifications and model lists to concrete versions, without referencing `latest`.
- Update only dependencies needed for this task; do not incidentally upgrade unrelated dependencies or refresh the entire lockfile.
- Use the repository-declared pnpm version and established installation method; do not replace the package manager or version-management tools.
- Maintain only one pnpm lockfile and commit the updated [pnpm-lock.yaml](../../../pnpm-lock.yaml).
- Review package-manifest and lockfile diffs together: do not commit unrelated lockfile or generated-file changes automatically produced by installation or builds; do not delete and regenerate the lockfile or manually splice lockfile entries.
- Resolve merge conflicts by re-resolving against both sides' manifests through a pnpm-supported process, preserving dependencies still needed by either side.
- If the package manager reports inconsistency between `node_modules` and configuration, diagnose the cause first rather than bypassing it with flags such as `--force`.
- Use configuration locations and syntax supported by that pnpm version for dependency overrides and security patches, rather than copying configuration from other package managers; do not commit dependency overrides temporarily added for local testing (`link:`, `pnpm link`, or `overrides` pointing to local paths).
- Do not temporarily download and execute undeclared packages through `npx`, `pnpm dlx`, or similar methods; use executables already present in dependencies (`pnpm exec`).
- Official scaffolding and generator CLIs may run through `pnpm dlx` as their documentation recommends (such as `pnpm dlx shadcn@latest init` or `add`).
- Run dependency installation scripts under the repository's existing policy.
- Before adding or broadening installation-script permissions, or making exceptions to supply-chain restrictions such as release cooldowns, obtain explicit authorization, then record the specific dependency, reason, and scope of approval using the locked pnpm version; do not permit all dependencies, and agents must not grant themselves exceptions.
- After upgrading Electron, Playwright, Expo SDK, Vitest, Jest, or Bun, actually run cases covering startup, IPC (or native bridging), and packaging at least once; successful installation or type checking does not establish upgrade safety.
- Run cases requiring windows or devices under "Do not disturb the foreground" in [Testing and verification](../chorus-testing/SKILL.md#testing-and-verification) and [Mobile app (apps/mobile)](../chorus-mobile/SKILL.md#mobile-app-appsmobile); when they cannot run locally, delegate them to a CI job that covers them, or state in the result that they were not verified.
