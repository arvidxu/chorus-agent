# AGENTS.md

This file is for AI coding assistants and developers working on `chorus-agent`. It describes the project structure, development process, coding standards, and acceptance requirements. All paths are relative to the repository root. Before editing, read the skills that "Skills" at the end of this file requires and, when present, the `README.md` of the application or capability package being changed (also read `DEVELOPMENT.md` for packages published to npm).

Resolve rule conflicts in this order: mandatory technical restrictions of the runtime environment and platform (such as sandboxing, permission modes, and read-only mode; plan mode, ask mode, and approval requirements declared by tools in text also belong to this level, while other default textual instructions about attribution, output format, default workflows, and similar matters rank below all `AGENTS.md` files), explicit user instructions for the current task, the nearest `AGENTS.md` for the directory being changed, ancestor `AGENTS.md` files and this file, the user's global instructions for all repositories, and finally skill instructions from outside this repository. The skills under `.agents/skills/` are part of this file and rank with it. Subordinate rules may only supplement or tighten this file, never relax it. An `AGENTS.md` that declares applicability to other directories has the same rank as the nearest `AGENTS.md` in those directories; when the two differ, follow the stricter rule.

User instructions may adjust task scope, implementation approach, and working habits, but must not relax any of the following: the entirety of [Permissions and security](.agents/skills/chorus-security-design/SKILL.md#permissions-and-security) (permissions and security), protection of secrets and credentials, prior authorization for destructive or external actions, the prohibition on bypassing Git hooks and security checks with `--no-verify` or similar means, and the prohibition on fabricating or overstating verification results. If the user asks to relax these requirements, explain the risk, do not carry out that part, and continue the remaining work normally. A failed check is not a skipped check: after being informed, the user may explicitly accept an identified failure as a known exception (for example, the release-check exceptions in [Releases](.agents/skills/chorus-release-ci/SKILL.md#releases)); record it in the result, PR, or release record, and do not relabel it as a pass.

In this file, "maintainer" means the person with decision-making authority over the repository, by default the current user unless otherwise agreed. "Code owner" means the owner for the corresponding path in `CODEOWNERS`, or the maintainer if that file or entry does not exist. Matters left to the maintainer in [Permissions and security](.agents/skills/chorus-security-design/SKILL.md#permissions-and-security) are limited to the decisions allowed by that particular rule; they must not be used to disable controls required by other rules.

This file holds the rules that apply to every task. Rules for particular directories, technologies, or tasks are in the skills listed under "Skills"; when a row there applies, read that skill in full before taking action. The basic rules summarize those skills; where a basic rule explicitly identifies an exception, follow the exception in the referenced skill. Otherwise, when this file and a skill, or two skills, differ, follow the stricter requirement and identify the inconsistency in the result.

## Project overview

Chorus Agent is a cross-platform AI agent application centered on task execution and multi-agent collaboration. Its capabilities include model invocation, context management and memory, tool execution and permission control, subagent collaboration and team management, Workflow orchestration, Goal-driven execution, and computer and browser control. A plugin center, Skills, MCP connections, and external Agent Runtime integrations extend its capabilities. It also provides mobile remote connections and voice dictation.

### Technology stack

- **Desktop**: Electron, React, Vite, Tailwind CSS, shadcn, and Base UI.
- **Mobile**: Expo, React Native, and Expo Router.
- **Agent core and shared packages**: TypeScript on Node.js.
- **Data**: Zod for application-owned data and Ajv for external JSON Schema; Node.js built-in `node:sqlite` with direct SQL and no ORM, accessed only in the execution host process.
- **Tooling**: pnpm workspaces, TypeScript `strict`, Oxlint and Expo Lint, Oxfmt, remark, Vitest, and Jest.

The complete technology choices for each part (command line and terminal interface, data validation and persistence, internationalization, React Compiler scope, TypeScript versions, and test tools) are under "Technology stack" in [Project structure and architecture](.agents/skills/chorus-architecture/SKILL.md#project-structure-and-architecture).

### Directories

The filesystem is the source of truth for what exists. The planned directory tree, domains, and capability package responsibilities are under "Project structure" in [Project structure and architecture](.agents/skills/chorus-architecture/SKILL.md#project-structure-and-architecture). When a task needs code that belongs to a planned package that does not exist yet, create that package with only what the task needs; creating it is part of the task's scope, and the package skeleton may land first in its own commit. Existing application code that belongs in such a package moves when a task changes that code's behavior, not because nearby code is edited; until then it is a known gap recorded outside the repository.

- `apps/desktop/`: Electron desktop application (main process, renderer, and packaging).
- `apps/mobile/`: Expo mobile application.
- `packages/`: Shared code, organized as `packages/<domain>/<capability-package>/`.
- `scripts/`: Scripts grouped by purpose, one subdirectory each.
- `.github/workflows/`: CI and release workflows.
- [CHANGELOG.md](CHANGELOG.md) and [product.conf.json](product.conf.json): Change log; product identity and the desktop and mobile versions.

### Where code goes

Place each application's entry code and dedicated platform code in its corresponding directory under `apps/`. Organize shared code as `packages/<domain>/<capability-package>/`. Pick the domain from this table, then the package from [references/project-structure.md](.agents/skills/chorus-architecture/references/project-structure.md).

| Code | Place |
| --- | --- |
| Electron main process, preload, windows, and renderer assembly | `apps/desktop/` |
| Expo routes and mobile UI | `apps/mobile/` |
| Command-line entry and subcommands | `apps/cli/` |
| Relay deployment entries | `apps/relay/` |
| Types and interfaces shared across packages or clients | `packages/contracts/` |
| Execution host, sessions, artifacts, workspaces, jobs, retrieval, configuration, profiles, notifications, and scheduling | `packages/services/` |
| Agent loop, planning, context, memory, tools, permissions, subagents, teams, workflows, goals, and acceptance | `packages/agent/` |
| Model provider and external Agent Runtime adapters | `packages/adapters/` |
| Plugins, skills, MCP, and computer and browser control | `packages/extensions/` |
| Filesystem, execution backends, terminals, sandbox, secrets, updates, and storage | `packages/platform/` |
| Accounts and authentication | `packages/identity/` |
| Logging, telemetry, and diagnostics | `packages/observability/` |
| Client and embedding SDKs | `packages/sdk/` |
| Device identity, transport, remote access, and relay logic | `packages/remote/` |
| Dictation | `packages/voice/` |
| Desktop components and feature UI, translations, and terminal UI | `packages/ui/` |
| Maintenance, check, release, and test-support scripts | `scripts/<purpose>/` |
| Cross-package integration tests and shared fixtures | `tests/` |

## Development environment

Install dependencies at the repository root with `pnpm install --frozen-lockfile`. Reinstall only when dependency inputs change or checks find missing dependencies. Do not share or link `node_modules` between worktrees. `devEngines` in the root [package.json](package.json) declares the pnpm and Node.js versions, and the Bun version once a package runs on Bun; pnpm downloads the declared Node.js and Bun into its store and runs package scripts and `pnpm exec` with them regardless of the versions on `PATH`. Run checks and lockfile updates through pnpm; `node` or `bun` invoked directly uses the version on `PATH`, and results from other versions do not count as verification. Workflows that run `node` directly set its version with `actions/setup-node` and `node-version-file: package.json`, which reads the same `devEngines` entry.

### Common commands

Run the following commands at the repository root. Package names after `--filter` must match `name` in the corresponding `package.json`. If a command differs from `package.json`, follow `package.json` and identify the discrepancy in the result.

- Install dependencies: `pnpm install --frozen-lockfile`.
- Start desktop development: `pnpm dev:desktop`; `pnpm dev` is the same entry point.
- Start the mobile development server: `pnpm dev:mobile`; use `pnpm dev:mobile:ios` and `pnpm dev:mobile:android` for iOS and Android respectively.
- Typecheck: `pnpm typecheck` covers every workspace package; add a new package's type check to it in the change that creates the package.
- Desktop build: `pnpm build`, which includes the desktop TypeScript build check.
- Lint: `pnpm lint` checks the whole repository, including file line counts, function complexity limits, and Markdown; warnings also count as failures. For partial checks, use `pnpm lint:code` (everything except mobile), `pnpm lint:mobile`, and `pnpm lint:md` respectively.
- Format: `pnpm fmt:check` checks code and configuration formatting; `pnpm fmt` fixes it automatically. Markdown is checked by `pnpm lint:md`.
- Desktop directory artifact: `pnpm --filter desktop package:dir`; installers: `pnpm --filter desktop package`.
- Full repository checks: `pnpm check`, which runs `pnpm typecheck`, `pnpm lint`, `pnpm fmt:check`, `pnpm test`, and `pnpm build` in sequence.
- Desktop startup smoke test: `pnpm test:e2e` builds the desktop app and runs its startup test. On macOS and Windows the window stays hidden and takes no focus; on Linux the window is shown, so run it under a virtual display such as `xvfb-run`, as CI does. CI runs it after `pnpm check`; run it locally when a change touches the main process, preload, IPC, or windows.
- Tests: `pnpm test` runs the full suite. See "Running tests" in [Testing and verification](.agents/skills/chorus-testing/SKILL.md#testing-and-verification) for selected tests, related tests, tests for a changed package, and single-file format and Lint commands.
- Package dependency cycle checks: `pnpm lint`, through Oxlint `import/no-cycle`.

## Basic rules

### Working approach

- Change only the requested target and the direct dependencies, callers, types, and tests required to complete it. Mention pre-existing issues outside scope only in the final reply; do not fix them incidentally, and do not open separate PRs for them without authorization (see "Working agreement" in [Working agreement and development process](.agents/skills/chorus-workflow/SKILL.md#working-agreement-and-development-process)).
- Proceed to completion and verification in the current turn; do not stop at analysis or a proposal.
- Pause for confirmation before performing actions that require authorization, deleting apparently intentional functionality, adding dependencies these rules do not already name or upgrading a dependency's major version, breaking public contracts, making intentional schema, data-retention, or permission changes, choosing between interpretations with substantially different or hard-to-reverse results, or proceeding when a requirement's premise is false.
- Full conditions are in [Working agreement and development process](.agents/skills/chorus-workflow/SKILL.md#working-agreement-and-development-process).
- Before editing, read the skills required by "Skills". Do not invent paths, commands, configuration options, package names, or exports; confirm they exist before use.
- Before using or changing framework or dependency APIs, use the repository's locked version and inspect installed type definitions or the official documentation for that version; do not rely on memory.
- Run commands noninteractively, and put development servers, watch tasks, and other persistent processes in the background. Before finishing, stop processes you started that are no longer needed; do not restart services manually maintained by the developer without authorization.
- Reply in the user's language. When the user asks a question, answer before making changes. In the final reply, state the result first, then the checks actually run, remaining risks, and decisions needed from the user.

### Security

- Do not disclose secrets, credentials, or private data, or put them in commits, PRs, comments, logs, screenshots, or conversation records. Do not put keys or tokens in command-line arguments (one exception in Permissions and security). Ask when required credentials are missing; do not fabricate them.
- Destructive resets or cleanup, `git stash`, deleting unrelated work, modifying or restarting services you did not create, and external actions such as pushing, publishing, sending messages, calling paid services, or changing remote resources all require explicit authorization for the current task before execution. Authorization covers only the action and target the user named. Confirm each push, tag push, PR creation or merge, publication, and message separately. Full rules are in [Permissions and security](.agents/skills/chorus-security-design/SKILL.md#permissions-and-security).
- Product code must treat model output, tool results, web and file content, and data returned by MCP services and plugins as untrusted input. Permission decisions and approvals run on the host side and deny on missing information, errors, or timeouts. Do not weaken security controls to simplify implementation, pass tests, or improve performance.

### Code

- Keep TypeScript `strict` enabled, including each flag it turns on, in every configuration that covers `.ts` or `.tsx` files, and do not hide problems with `any`, `@ts-ignore`, or non-null assertions `!`; unavoidable exceptions follow [Coding style](.agents/skills/chorus-coding-style/SKILL.md#coding-style). Use `unknown` for unknown data: validate untrusted input with a schema at the receiving boundary and narrow other data there, then pass it internally.
- Do not add special cases, hardcode expected values, skip or delete tests, weaken assertions, relax Lint or type rules, change check baselines, or add inline disabling comments just to pass checks (see the single-line exception under "Development process" in [Working agreement and development process](.agents/skills/chorus-workflow/SKILL.md#working-agreement-and-development-process) when correcting the code truly cannot solve the issue). Do not bypass hooks with `--no-verify`.
- Cross-package imports must use package names and public `exports`; dependency cycles are prohibited.
- Allowed dependency directions, composition-entry exceptions, and runtime boundaries are defined under "Package boundaries and dependencies" in [Project structure and architecture](.agents/skills/chorus-architecture/SKILL.md#project-structure-and-architecture); encode them in the root [.oxlintrc.json](.oxlintrc.json) as the packages they govern are created; obtain maintainer confirmation before using an unregistered direction.
- Reuse or extend existing implementations before writing new logic; do not create a parallel implementation. Keep changes minimal, without unrelated formatting, moves, or rewrites.
- Human-maintained code files must not exceed 800 physical lines (including comments and blank lines). Functions must not exceed cyclomatic complexity 20, block nesting 6 levels, or length 300 lines. No exception baselines are allowed.
- Product code logs through `packages/observability/logging`, not direct `console.*` calls (except user-facing CLI/TUI terminal output, maintenance scripts, and tests; see [Coding style](.agents/skills/chorus-coding-style/SKILL.md#coding-style)).
- Do not use module-level mutable singletons; create long-lived instances at composition entries and pass them down (see "Architecture boundaries" in [Design and interface contracts](.agents/skills/chorus-architecture/SKILL.md#design-and-interface-contracts)).
- Read URLs and parameters that vary by deployment environment through the configuration interfaces described in [Coding style](.agents/skills/chorus-coding-style/SKILL.md#coding-style), not hardcoded values in business code.
- Read user-visible text through the internationalization interface; see [Internationalization](.agents/skills/chorus-i18n/SKILL.md#internationalization).

### Verification and delivery

- After changing TypeScript code, before delivery you must run typechecking covering the changed package, format checks and Lint on changed files, and the changed package's tests.
- Editor diagnostics do not replace these commands.
- When changing shared packages imported by other clients, also run their consumers' typechecks and tests.
- For documentation-only changes with no behavioral change, follow "Verification discipline" in [Testing and verification](.agents/skills/chorus-testing/SKILL.md#testing-and-verification).
- Verify behavioral bug fixes with tests that fail before the fix and pass afterward (for exceptions for pure text, style, or configuration fixes, see "Test requirements" in [Testing and verification](.agents/skills/chorus-testing/SKILL.md#testing-and-verification)). Determine results from command exit codes.
- Report which checks actually ran, mark unrun checks as unverified and tasks lacking acceptance evidence as incomplete, and do not overstate completed work.

### Git

- Do not commit, push, or create PRs unless the user asks. Merging a PR requires explicit user approval for that PR. Specify paths when staging; do not use `git add -A` or `git add .`.
- Commit messages and PR titles use English Conventional Commits in the form `type(scope): description`. Every commit has a body saying what changed and why: one point as a plain sentence, several points as a short `-` list. Commit messages carry no test plan or test results.
- Do not force push shared branches, bypass Git hooks, or change Git configuration on your own. Do not incidentally increment versions for ordinary features, fixes, or documentation changes.

### Definition of done

A task that adds or changes product behavior is done only when every item below holds. Otherwise report it as incomplete and list what is missing; listing a gap does not make the task done. A task that only adds code nothing calls yet, such as a package skeleton, says so in the result instead of claiming item 1.

1. Reachable: within the task's scope, the behavior is wired end to end from the real user entry point (a window, command, or route) to the real implementation, not to a demo page or a module nothing calls.
2. No placeholders: product code has no stubs, sample or mock data, hardcoded results, "not implemented" branches, or UI that is not connected to behavior.
3. States: asynchronous interfaces handle loading, empty data, error, and success states separately, as "State and feedback" in [UI development](.agents/skills/chorus-ui/SKILL.md#ui-development) describes.
4. Tests: tests cover only the main flow and important edge cases, and a behavioral bug fix has a test that fails before the fix and passes after it, as "Test requirements" in [Testing and verification](.agents/skills/chorus-testing/SKILL.md#testing-and-verification) describes.
5. Exercised: the result says whether the behavior was run through its real entry point, by an automated run that shows no window or by a CI run you cite; `pnpm test:e2e` shows only that the application starts. Passing unit tests and a successful build do not show this; when it was not run, report the behavior as unverified.
6. `pnpm check` passes, or the checks that "Verification and delivery" requires for the changed scope pass and the result states that the full check is left to CI.

### Pre-delivery self-check

Before ending the task or reporting completion, check each item; see the corresponding skills for details:

1. Requirements: Compare each user requirement, each acceptance criterion, and the definition of done; explicitly list unfinished items.
2. Scope: The final diff contains only changes needed for this task, each traceable to a user requirement, with no unrelated formatting, debug output, temporary files, commented-out code, or secrets.
3. Synchronization: Update affected callers, types, tests, documentation, translation keys, generated files, and migrations together.
4. Checks: Run format checks, Lint, typechecks, and the changed package's tests for the scope of the changes. Run consumer checks when changing shared packages imported by other clients (for documentation-only changes, follow "Verification discipline" in [Testing and verification](.agents/skills/chorus-testing/SKILL.md#testing-and-verification)). Record actual commands and results; mark unrun checks as unverified.
5. Report: State the result first, then verification, remaining risks, and decisions needed from the user.

## Skills

When a row applies, read that skill in full before taking action; when several rows apply, read each.

| Before touching | Read |
| --- | --- |
| Any Git or GitHub operation: staging, commits, pushes, branches, PRs, issues, comments, or reviews | [.agents/skills/chorus-git-workflow/SKILL.md](.agents/skills/chorus-git-workflow/SKILL.md) |
| Reviewing a diff or PR, choosing reviewers, or responding to review comments | [.agents/skills/chorus-code-review/SKILL.md](.agents/skills/chorus-code-review/SKILL.md) |
| Emitting commits, PRs, comments, logs, or screenshots; destructive, external, or paid actions; writing test data; code involving credentials, permissions and approvals, tool and command execution, file paths and subprocesses, sandboxes, network requests, encryption, database queries, data isolation and deletion, logs and telemetry, long-term memory, voice data, workspace configuration loading, rendering model output and web content, subagents and teams, unattended Goals, Workflows and scheduled tasks, plugins, MCP and skills, external Agent Runtimes, `sdk/client` local channels and remote connections, computer and browser control, application updates, Electron or system permissions, user configuration writes, CI workflows, or external JSON Schema | [.agents/skills/chorus-security-design/SKILL.md](.agents/skills/chorus-security-design/SKILL.md) |
| Writing or changing TypeScript or JavaScript, including scripts under `scripts/` and tool configuration files | [.agents/skills/chorus-coding-style/SKILL.md](.agents/skills/chorus-coding-style/SKILL.md) |
| Adding, moving, or splitting files, modules, or packages; choosing languages, frameworks, runtimes, or tools; changing package dependencies, public exports, interface contracts, protocols, configuration options, persisted data, the Agent loop, sessions, tool schemas, provider adapters, caches, or database access; fixing bugs; changing function signatures, UI structure, or functionality shared between desktop and mobile | [.agents/skills/chorus-architecture/SKILL.md](.agents/skills/chorus-architecture/SKILL.md) |
| Public interfaces, protocols, configuration options, schemas, compatibility, or deprecation | [.agents/skills/chorus-interface-contracts/SKILL.md](.agents/skills/chorus-interface-contracts/SKILL.md) |
| Persisted data, database access, migrations, `node:sqlite`, or data shared by several hosts | [.agents/skills/chorus-persistence/SKILL.md](.agents/skills/chorus-persistence/SKILL.md) |
| The Agent loop, sessions, session events, tool schemas, provider adapters, or model catalogs | [.agents/skills/chorus-agent-runtime/SKILL.md](.agents/skills/chorus-agent-runtime/SKILL.md) |
| `packages/remote/`, `packages/contracts/remote/`, `apps/relay/`, or the request handling that remote channels reach | [.agents/skills/chorus-remote/SKILL.md](.agents/skills/chorus-remote/SKILL.md) |
| Adding, upgrading, or removing dependencies; package manifests, lockfiles, dependency overrides, or install-script permissions | [.agents/skills/chorus-dependencies/SKILL.md](.agents/skills/chorus-dependencies/SKILL.md) |
| Writing, changing, or running tests; changing mocks and development data; verifying changes; reporting completion; handling CI failures; measuring performance | [.agents/skills/chorus-testing/SKILL.md](.agents/skills/chorus-testing/SKILL.md) |
| Code comments, documentation, README files, examples, `AGENTS.md` and other rule files, skills or prompts, or documenting commands | [.agents/skills/chorus-documentation/SKILL.md](.agents/skills/chorus-documentation/SKILL.md) |
| Starting any task: scope, pausing and authorization, reading and locating code, files and commands, processes and local verification, debugging, design tradeoffs, and writing replies, progress updates, questions, or commands for the user | [.agents/skills/chorus-workflow/SKILL.md](.agents/skills/chorus-workflow/SKILL.md) |
| Creating subagents, dividing work by role, or running a planning, implementation, and evaluation loop; evaluating task completion by agents; tasks that come from evaluation failures, scorers, benchmarks, traces, or result files; designing or changing check gates; lengthy background evaluations | [.agents/skills/chorus-delegation/SKILL.md](.agents/skills/chorus-delegation/SKILL.md) |
| Versions, change logs, build configuration, development-data entry points, releasing, release workflows or configuration, or release notes | [.agents/skills/chorus-release-ci/SKILL.md](.agents/skills/chorus-release-ci/SKILL.md) |
| `packages/ui/`, desktop renderer UI, or mobile UI; component reuse, state, and feedback in any client's UI; accessibility | [.agents/skills/chorus-ui/SKILL.md](.agents/skills/chorus-ui/SKILL.md) |
| Text input, keyboard shortcuts, or composition events | [.agents/skills/chorus-ime/SKILL.md](.agents/skills/chorus-ime/SKILL.md) |
| Any user-visible text (including main-process native menus and dialogs, TUI and CLI output, and text returned by the host to the UI), translation resources, or locale files | [.agents/skills/chorus-i18n/SKILL.md](.agents/skills/chorus-i18n/SKILL.md) |
| `apps/desktop/`: main process, preload, windows, IPC, and renderer assembly | [.agents/skills/chorus-desktop/SKILL.md](.agents/skills/chorus-desktop/SKILL.md) |
| `apps/mobile/` | [.agents/skills/chorus-mobile/SKILL.md](.agents/skills/chorus-mobile/SKILL.md) |
