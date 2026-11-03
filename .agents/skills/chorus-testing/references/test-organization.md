# Test organization

- Keep unit tests in a `__tests__/` directory beside the source files they cover, named `*.test.ts`, `*.test.tsx`, or `*.test.mjs` for JavaScript scripts; mobile `apps/mobile/src/app/` contains only routes and layouts, with their tests outside the route directory (such as `apps/mobile/src/__tests__/`).
- Put package integration tests in `packages/<domain>/<capability-package>/test/`, cross-package integration tests in root `tests/integration/`, desktop E2E in `apps/desktop/tests/e2e/`, and mobile E2E flows in `apps/mobile/.maestro/`.
- Verification scripts using real providers, networks, or physical devices belong in `scripts/verify/`, run only through a dedicated root `package.json` script, and stay outside default tests and CI (`pnpm test` and `pnpm check`).
- See "Technology stack" in [Project structure and architecture](../../chorus-architecture/SKILL.md#project-structure-and-architecture) for test tools; fixtures belong in each package's `test/fixtures/`, with shared cross-package fixtures in `tests/fixtures/`.

- Before running tests, inspect module imports and mocks for side effects.
- When replacing class dependencies, inject substitutes implementing real interfaces through constructor arguments, defaulting to real implementations rather than installing substitutes with `any` assertions; modify global objects only when no other viable approach exists.
- Use isolated state and ports, with system-allocated test-server ports (port 0), not hardcoded ports.
- Before importing modules that read or write user configuration, direct data and configuration directories to test-only locations; do not run, write, or clean up in actual user data or configuration directories, and clean up only paths created by the tests themselves.
- Before test code deletes or overwrites files or initializes repositories, confirm targets lie inside the test temporary directory, failing otherwise; do not add production branches specifically for this.
- Migration fixtures use synthetic data; real-data migration verification operates only on local copies under [Permissions and security](../../chorus-security-design/SKILL.md#permissions-and-security), without changing originals.
- Restore or clean mock handlers and shared stores between cases; tests requiring complete request mocking fail on unhandled requests rather than silently accessing real services.
- Stub environment-variable changes with the test framework and restore them after each case.
- Each test entry point directs `HOME`, `XDG_*`, and `TMPDIR` (plus `USERPROFILE`, `APPDATA`, `LOCALAPPDATA`, `TMP`, and `TEMP` on Windows) to a newly created directory when the runner starts, deleting it on completion, failure, or interruption; individual cases use their own temporary subdirectories.
- Test-launched application instances and the developer's running Chorus do not affect each other: each run uses newly created data, log, cache, and credential-storage locations, without acquiring or contending for the developer instance's single-instance lock.
- Test launches do not wake, focus, or modify existing Chorus instances or their data.

- Unit tests and default offline regression tests do not access the public network or send product telemetry or tracing data.
- Before running, isolate environment variables that trigger external requests and replace real URLs with local test servers.
- Offline model calls use scripted fixed responses; when real protocol structure is needed, retain only protocol-defined structure from recorded responses (event ordering, field names, event types, and enum values), rewriting values such as content, identifiers, tokens, and timestamps under [Permissions and security](../../chorus-security-design/SKILL.md#permissions-and-security), and do not commit original recordings.
- Other dependencies default to real implementations; mock only external networking, time, feature flags, and heavyweight dependencies difficult to run in tests, documenting the reason beside each mock.
- Understand all side effects before mocking a method and keep parts relied upon by tests real; substitutes return all fields downstream code reads, preferably constructed through the corresponding schema or data factory.
  Filesystem tests use real operations in temporary directories, without mocking filesystem modules such as `node:fs`; pass substitutes implementing the same interface only when the subject receives file operations through dependency injection and the target is caller logic rather than filesystem behavior. Test the interface's own implementation with real file operations. Database tests use isolated databases running production migrations, rather than handwritten table creation or storage-layer stubs instead of migration verification. Integration and end-to-end verification requiring real providers, networks, or devices uses separate entry points and meets corresponding authorization requirements, without automatic triggering by credentials in the environment; tests requiring credentials or incurring costs follow real-provider test rules under "Communication style" in [Working agreement and development process](../../chorus-workflow/SKILL.md#working-agreement-and-development-process).

- Normalize path separators before comparing filesystem paths in cross-platform assertions, including sources and destinations recorded by injected file-operation substitutes; check both positive and negative assertions using `/` to avoid failures or false passes on Windows.

- End-to-end tests locate elements by accessibility role and name first, then a single stable `data-testid`; do not rely on style classes or third-party component internals, or use test hooks for styling.
- Simulated DOMs such as jsdom do not prove real-browser layout, styling, or interactions; verify those in real browsers or Electron.
- Unless the user explicitly requests it, do not emulate color schemes or reduced-motion preferences in windows the user is using; use isolated test contexts for those scenarios.

- E2E cases use synthetic credentials only; verification requiring real credentials does not record traces or videos.

- Choose the lowest level that proves behavior for the code's runtime: test renderer interface behavior with Vitest (DOM environment), or load the renderer development server in a browser, replacing host connections and preload with mocks from `apps/desktop/dev/`.
- Test main-process and preload logic independent of the Electron runtime in `desktop-main`; launch Electron only when behavior depends on its real runtime (window lifecycles, actually exposed preload interfaces, IPC wiring, tray, system permissions, and packaged artifacts).
- Default tests and routine CI jobs do not launch external browsers or helpers used for browser or computer control; use separate entry points for those acceptance checks.
- Each test-launched process (development server, browser, Electron, or helper) is owned by its launching fixture or script, terminated on success, failure, timeout, and cancellation, with absence of leftovers confirmed; do not terminate existing development servers you connect to.
- Fixtures stop timers, listeners, database connections, and subprocesses and wait for them to finish before deleting temporary directories; background work subject to assertions completes before fixture teardown.
