# Running tests

- Choose verification according to change scope and risk, prioritizing targeted tests covering changed behavior.
- First inspect diagnostics from existing editors or watch tasks; do not launch equivalent watch processes if current diagnostics are already available, but editor diagnostics do not replace required type-check, Lint, and test commands.
- Reuse suitable tasks in task tools when available, otherwise use repository commands directly.
- After TypeScript changes, run type checks covering modified packages before delivery; run full type checks or builds for broad or cross-module changes, build or type-configuration changes, or compilation problems reported by other verification.
- Run these at the repository root: type checks `pnpm typecheck`, desktop build `pnpm build` (do not repeat type checks covering the same inputs).
- When modifying shared packages imported by other clients (such as `contracts/*`, `sdk/client`, `ui/i18n`, or `ui/components`), also run caller type checks and tests.
- Documentation-only changes without behavioral effects follow "Verification discipline".

- When judging changes by test results, first run relevant tests on pre-change code and record the baseline; report existing failures first rather than attributing them to this change. Before delivery, run all tests for modified packages once against final code, not just new or modified test files.

- Specific tests: run `pnpm vitest run <test-file>` at the repository root; for mobile, `pnpm --filter mobile test <test-file>`; for CLI and TUI, `pnpm --filter <package-name> exec bun test ./<test-file>` (Bun paths begin with `./`, otherwise matching uses name substrings).
- Commands run through `--filter` execute in the corresponding package directory, so `<test-file>` is relative to that directory. pnpm forwards all arguments after the script name (including `--`) unchanged; do not add `--` after script names.
- Related tests: run `pnpm vitest related --run <changed-file>` at the repository root; for mobile, `pnpm --filter mobile test --findRelatedTests <changed-file>`.
- All tests for modified packages: shared packages use `pnpm vitest run --project <package-name>` (project names match package names).
- Desktop has two projects, `desktop-main` (main process and preload, Node.js environment) and `desktop-renderer` (DOM environment), run with the same command; repository scripts under `scripts/` use the `scripts` project (`pnpm vitest run --project scripts`); mobile uses `pnpm --filter mobile test`; CLI and TUI use `pnpm --filter <package-name> exec bun test`.
- For `sdk/client` changes, also run its contract tests: they reside in the package's `test/contract/`, use only test interfaces supported by both Bun and Vitest, and run in Bun with `pnpm --filter @chorus/sdk-client exec bun test ./test/contract`.
- When a package has no tests yet, these package-level commands fail; because a runner can be configured to pass with no tests, check the reported test count; report "this package has no tests" rather than adding `--passWithNoTests`.
- The full `pnpm test` suite allows projects without tests.
- Single-file formatting checks and Lint: `pnpm exec oxfmt --check <file>`, `pnpm exec oxlint --deny-warnings <file>`; Markdown uses `pnpm exec remark <file> --frail --quiet`. Do not run formatting checks on files excluded from formatting (the `ignorePatterns` in the root [.oxfmtrc.json](../../../../.oxfmtrc.json), and lockfiles, which Oxfmt skips by default); mobile-file Lint uses `pnpm --filter mobile exec eslint --max-warnings 0 <file>`.
- Desktop startup smoke test: run `pnpm test:e2e` at the repository root; it builds the desktop app first.
- Full test suite: run `pnpm test` at the repository root, sequentially running Vitest and mobile Jest, and Bun test for CLI, TUI, and `sdk/client` contract tests once those packages exist. Add a new package's tests to it in the change that creates the package.

- When multiple agents work simultaneously, the lead coordinates expensive checks to avoid concurrent duplicates. If tests unexpectedly consume large amounts of CPU, stop that test's process family, analyze a representative case of controlled size, then retry; inspect production logic, fixture generation, subprocesses, and repeated initialization, preserving regression coverage during optimization.

- Bun test loads all package test files in one process: cases do not use module replacements such as `mock.module` that persist across files; inject dependencies through arguments. Restore global timers, environment variables, and system time at the end of each file.
