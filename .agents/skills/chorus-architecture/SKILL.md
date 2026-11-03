---
name: chorus-architecture
description: Use when adding, moving or splitting files, modules or packages; choosing languages, frameworks, runtimes or tools; changing package dependencies, public exports, interface contracts, protocols, configuration options, persisted data, the Agent loop, sessions, tool schemas, provider adapters, caches or database access; fixing bugs; or changing function signatures, UI structure, or features shared by desktop and mobile.
---

## Project structure and architecture

- Architecture boundaries continue in [Design and interface contracts](#design-and-interface-contracts), which has the same reading conditions; read both.
- Rules for the Agent runtime, tools and providers are in [chorus-agent-runtime](../chorus-agent-runtime/SKILL.md), persistence rules in [chorus-persistence](../chorus-persistence/SKILL.md), and interface contracts in [chorus-interface-contracts](../chorus-interface-contracts/SKILL.md); they have the same reading conditions, so read them as well.

### Technology stack

- The "Technology stack" list in `AGENTS.md` lists only the main choices; this section is the complete record of the technology choices for each part of the repository. Versions are not listed here: dependency versions are declared in each package's `package.json` and the lockfile, and the pnpm, Node.js, and any Bun versions in `devEngines` of the root [package.json](../../../package.json).
- **Agent core**: TypeScript and Node.js.
- **Desktop host**: Electron.
- **Desktop frontend**: React, Tailwind CSS, shadcn, and Base UI; Hugeicons for icons and Motion for animation.
- **Mobile**: Expo, React Native, Expo Router, and React Native Reanimated.
- **Command line and terminal interface**: Implemented in TypeScript and run on Bun; the CLI uses Commander.js, and the TUI uses OpenTUI + Solid. The CLI is compiled into platform-specific executables and distributed through npm.
- **Relay service**: TypeScript against Web-standard APIs (WebSocket, `fetch`, and Web Crypto) in `remote/relay`, deployed from `apps/relay` to Cloudflare Workers with Durable Objects or to a self-hosted Node.js process; deployment targets are in [Remote connectivity](../chorus-remote/SKILL.md#remote-connectivity).
- **Data validation**: Zod for runtime definitions of application-owned data; Ajv for validating external JSON Schema documents and data against them.
- **Data persistence**: Node.js built-in `node:sqlite`, with SQL written directly and no ORM. Database schemas are managed through `PRAGMA user_version` and numbered migration files, and accessed only in the execution host process.
- **Internationalization**: i18next and react-i18next. Translation resources, initialization, and formatting utilities are centralized in the DOM-independent `packages/ui/i18n` for all clients. Locale files are in `packages/ui/i18n/src/locales/`; enabled languages are `en`, `zh-CN`, and `zh-TW`.
- **Package management**: pnpm workspaces for the multi-package repository. pnpm is the only package manager and script runner: Bun is a runtime for the CLI, the TUI, and the `bun test` suites listed under "Tests", and does not install dependencies or run repository scripts (no `bun install`, `bun add`, or `bun run`).
- **Build and packaging**: Vite, React Compiler (enabled for the desktop renderer, including `packages/ui/components` and `packages/ui/features`, and for mobile), and electron-builder; maintenance scripts run on Node.js.
- **Code quality**: TypeScript with `strict` enabled and typechecking.
- Desktop, shared packages, and CLI use one TypeScript version, taken from the `catalog` in [pnpm-workspace.yaml](../../../pnpm-workspace.yaml); mobile uses the version required by the current Expo SDK (as determined by `pnpm --filter mobile exec expo install --check`), and shared packages imported by mobile must also pass mobile typechecking.
- The root manifest's `typescript` type-checks the root configuration files listed in the root [tsconfig.json](../../../tsconfig.json).
- Desktop, shared packages, and CLI use Oxlint; mobile uses Expo Lint.
- Lint must have zero warnings.
- Code and configuration are formatted with Oxfmt; Markdown is checked by remark.
- Package dependency cycles and restricted imports are checked by Oxlint.
- **Tests**: Shared packages under `packages/` except `ui/tui`, and desktop main-process, preload, and renderer unit tests use Vitest.
- Desktop UI end-to-end tests use Playwright's Electron driver (`_electron.launch`).
- Mobile unit and component tests use Jest, jest-expo, and React Native Testing Library.
- CLI, TUI, and the Bun contract tests for `sdk/client` use Bun test; terminal components use OpenTUI testing tools.
- Mobile end-to-end tests use Maestro.
- Test `remote/relay` in each runtime it is deployed to, as described in [Remote connectivity](../chorus-remote/SKILL.md#remote-connectivity).

### Project structure

The directory tree, package naming, where each package runs, and what each package is responsible for are in [references/project-structure.md](references/project-structure.md). Read it before creating, moving, or naming a package or file, deciding where code belongs or runs, or changing imports or exports across packages.

### Architecture overview

The repository separates responsibilities among application entries, capability packages, and shared contracts. The Agent core collaborates with interfaces, provider protocols, and platform implementations through explicit interfaces; application entries handle composition.

#### Key architecture patterns

- The desktop main-process entry is [apps/desktop/src/main/index.ts](../../../apps/desktop/src/main/index.ts), responsible for windows, platform integration, and the execution host lifecycle; the preload entry is `apps/desktop/src/preload/index.ts`.
- The React renderer owns the desktop interface, with entry [apps/desktop/src/renderer/src/main.tsx](../../../apps/desktop/src/renderer/src/main.tsx) and page [apps/desktop/src/renderer/index.html](../../../apps/desktop/src/renderer/index.html).
- The main process starts the desktop execution host in a separate process through Electron `utilityProcess`; like the CLI, the renderer connects to the host through `sdk/client`.
- The main process does not directly access databases or run the Agent loop.
- Mobile route entries reside in `apps/mobile/src/app/`, with `_layout.tsx` defining route layout.
- The Agent core owns execution flows and domain state, using models, tools, and storage through capability interfaces; integration adapters convert external protocols, and platform capabilities implement operating-system-specific behavior.
- The core does not directly depend on Electron windows, React components, or private provider protocols.
- Represent task receipt, execution termination (success, failure, or cancellation), and passing acceptance separately; plan checklists, plan mode, and intermediate records do not prove completion.
- For tasks with acceptance conditions, `agent/acceptance` determines completion from conditions and evidence; tasks without acceptance conditions (such as Q&A or one-off commands) complete when execution ends successfully.
- Do not judge inspection tasks as failures merely because they find no problems.

#### Package boundaries and dependencies

- Dependencies point from applications and adapter implementations toward the core and shared contracts.
- Shared contracts do not depend on applications, UI, or concrete implementations; the core depends on contracts, integration and platform adapters implement the corresponding contracts, and application entries compose the core and adapters.
- Inject external capabilities into the core through interfaces, without reverse imports of applications or concrete adapter implementations; extension, remote, and voice capabilities likewise do not depend on application entries or UI implementations.

- Circular dependencies between packages and runtime module import cycles are prohibited.
- Register allowed inter-domain dependency directions in the root [.oxlintrc.json](../../../.oxlintrc.json); `pnpm lint` checks package dependency cycles with `import/no-cycle` and prohibited directions with `no-restricted-imports`, while review checks constraints that the rules file cannot express (such as consistent first-party package versions).
- Run this check when changing package dependencies, public exports, or module boundaries; successful compilation does not replace layer validation.
- Any package depending on `contracts/*`, packages other than `contracts/*` depending on `observability/logging` (which depends only on `contracts/*`, has public entries independent of Node.js or DOM, and receives platform output implementations injected by the composition entry), and composition entries depending on domain packages for composition are all allowed directions requiring neither registration nor confirmation.
- Composition entries mean application entries (`apps/*`) and the execution host's composition entry (`packages/services/agent-host/src/main.ts`, which starts the host process; the package's other modules follow the domain rules); their dependencies still obey runtime boundaries: CLI and TUI within Bun processes, mobile, and renderer do not import Node.js-side packages; mobile does not import DOM-dependent packages; the desktop main process imports only the packages listed for it in [references/project-structure.md](references/project-structure.md); and `apps/relay` follows [Remote connectivity](../chorus-remote/SKILL.md#remote-connectivity).
- Encode these boundaries as prohibitions in [.oxlintrc.json](../../../.oxlintrc.json), and the mobile ones in [apps/mobile/eslint.config.js](../../../apps/mobile/eslint.config.js), because Oxlint ignores `apps/mobile/`.
- Add other inter-domain dependencies (such as `agent/*` depending on `services/*`, or `extensions/*` on `platform/*`) only if the rules file already allows them.
- When not allowed or not yet determined, first explain the reason and obtain maintainer confirmation, then state the dependent package, dependency package, and reason in the PR; agents may encode directions these rules already define, but must not modify the rules file to allow other directions on their own.
- After confirmation, update the rules file in the same PR.
- Prefer injection by the composition entry through `contracts` interfaces over direct implementation-package dependencies when possible; define internal interfaces injected by composition entries under `contracts/`, creating a `contracts/<name>` package when existing packages are unsuitable.

- Across packages, use package names and public `exports` from `package.json`, declaring dependencies in the consumer's manifest; do not access another package's private source through relative paths or aliases.
- Root configuration files that hold single-source values (such as `product.conf.json`) and the test-support scripts in `scripts/test/` are not package source; applications and scripts read them by relative path.
- Use relative imports within a package and do not configure path aliases such as `@/`, except those a framework template generates.
- The only exception is a workspace package whose shadcn `components.json` `aliases` require a path alias (see [UI development](../chorus-ui/SKILL.md#ui-development) for which packages own a `components.json`): it may map `@/*` to its own `src/` and nothing else, and only code generated by the shadcn CLI may import through it.
- Review checks cross-package relative imports, and `@/` imports outside the package that configures the alias (in shadcn packages, outside the directories the shadcn CLI generates into).
- Export only interfaces callers need and keep internal helpers inside the package; keep public entries small and explicit, without barrel files that aggregate and re-export entire subdirectories.

#### Module and file organization

- Assign new code to modules and directories by feature or business domain, keeping files that jointly implement a feature in its module rather than collecting different businesses solely by technical categories such as components, services, or tools.
- Divide subdirectories within modules by actual responsibility and further split by subfeature when files become numerous.
- Preserve framework conventions for entries and route directories; do not move unrelated code to tidy directories.
- Put new code in existing top-level categories and do not add top-level directories without a corresponding architecture decision.

Correct: directories reflect feature ownership.

```text
<source-directory>/
├── orders/
│   ├── orderService.ts
│   └── orderRepository.ts
└── billing/
    ├── invoiceService.ts
    └── invoiceRepository.ts
```

Incorrect: different businesses mixed by technical category.

```text
<source-directory>/
├── services/
│   ├── orderService.ts
│   └── invoiceService.ts
└── repositories/
    ├── orderRepository.ts
    └── invoiceRepository.ts
```

- Organize each code file around one clear concept or responsibility, with a filename accurately describing its content. Closely related small implementations of one concept may share a file; split unrelated responsibilities into their corresponding modules rather than continuing to mix them because the line limit has not been reached. Do not place unrelated logic under generic names such as helpers, utils, or common, or split purely by line count into unclear part1 or part2 files.

## Design and interface contracts

This section continues [Project structure and architecture](#project-structure-and-architecture), with the same reading conditions.

### Architecture boundaries

- Separate presentation, control, and business responsibilities from the first UI implementation.
- Presentation components only receive data and event callbacks and handle declarative rendering and event binding; they neither fetch business data nor call underlying data services directly, and they hold no business state.
- Put cross-module state machines, business computations, and simulation engines in the business layer (business services and domain objects within the owning module; neither "business layer" nor "service layer" in this section means the `packages/services/` domain).
- The control layer connects presentation and business, supplying data and operations to the interface and translating interface events into business calls.
- In technology stacks using hooks, higher-level hooks perform this connection; in stacks using container components or similar approaches, the corresponding control layer does so.
- Maintain these boundaries when modifying code; do not mix business logic, data access, and rendering in pages or presentation components.

```text
Correct: presentation emits events, control coordinates, and business and data access have their own owners
View.onSubmit(input)
  -> OrderController.submit(input)
  -> OrderService.create(input)
  -> OrderRepository.save(order)
OrderController.state -> View.render(state)

Incorrect: a page event handles requests, business rules, persistence, and rendering together
View.onSubmit(input)
  -> sendHttpRequest(input) -> calculatePrice(input) -> writeDatabase(input) -> renderResult(input)
```

- Shared core modules depend only on lower-level fundamentals and their own domain concepts; put higher-level product logic in the responsible caller, adapter, service, or UI/API layer.
- Pass across layers only data the recipient needs for its responsibilities, not large context objects, request or session metadata, IDs, internal record state, or callbacks unless the recipient truly needs them.
- When a change appears to require one layer to understand another's internal concepts, stop first and seek caller-side mapping, adapters, events, small explicit interfaces, or reduced data crossing the boundary.

- Do not use module-level mutable singletons or registration through import-time side effects.
- Create long-lived service instances at composition entries and pass them down; session- or request-scoped instances are created by their state's owner, and their lifetimes match the state's owner.
- Likewise, create infrastructure instances such as logging and configuration at composition entries and pass them through constructor parameters or explicit context objects; `packages/observability/logging` and `services/configuration` provide interfaces and factories, not module-level global instances.
- Resolve only one copy of libraries requiring singleton identity (React, editor cores, and so on) in an application; pass only serialized data across iframe, window, or package-copy boundaries, not object instances.
- Avoid statements with side effects at module top level, because they hinder tree-shaking.

- Do not add dedicated options to shared functions for a single caller; prefer small-scale duplication to abstractions with flags or mode branches, and do not write wrappers that only rename things.
- Before introducing an interface or port, confirm at least two actual implementations (usually production and a test double); depend directly on a sole implementation (except inter-domain dependencies injected through `contracts` interfaces as described under "Package boundaries and dependencies" in [Project structure and architecture](#project-structure-and-architecture)).
- To judge whether a module merely passes things through, imagine deleting it: if complexity disappears with it, it is a pass-through layer; it is worth retaining only when complexity would spread to multiple callers.
- When an existing implementation can do the work without new flags or mode branches, extend or reuse it under [Coding style](../chorus-coding-style/SKILL.md#coding-style).
- Keep platform differences in platform adapters rather than scattering platform branches through shared code; before changing shared interfaces or widely used function signatures, first confirm whether the problem occurs on only one path.
- New DOM or browser API calls use an element's `ownerDocument` and its `defaultView` rather than global `document` or `window`, to support multiple windows and iframes.

- Assign clear ownership for data interpretation and resource management, and put state and capability flags on objects that use them and own the corresponding behavior.
- Consumers use results parsed by the responsible owner rather than reinterpreting raw data; preserve identity, field absence, uncertainty, and provenance evidence across layers.
- After resource cleanup fails, the original owner retains responsibility and reports cleanup as unconfirmed, rather than logging and treating it as complete.
- Judge ownership separately from validity, editability, and readiness: corruption does not change data ownership, and the owner may still delete or repair it under the rules (preserve original data under [Permissions and security](../chorus-security-design/SKILL.md#permissions-and-security) when encrypted data is corrupted).
- Keep identity or applicability unknown until confirmed, rather than treating it as absent, owned elsewhere, or already matched.

- Add caches only for measured costs and provide data in the PR.
- Cache keys include every input affecting results, with explicit invalidation conditions and lifetimes; default to a single execution or session, and give cross-execution persistent caches explicit size limits and invalidation rules.
- Before reporting cached state as current, confirm it still reflects current conditions.
- Features disabled by default or used only on some paths must not add overhead to requests that do not use them.
- Request-scoped context objects contain only small handles; dedicated manager objects own data that grows with streaming content.

- During implementation, debugging, review, and maintenance, inspect error-prone designs in the changed code: correct the problematic data representation or ownership rules before considering downstream remedies; normalize only once using a format-aware parser at the boundary responsible for receiving data.
- Introduce abstractions only when they remove identified complexity.
- When fixing defects or addressing review comments, inspect the origin and affected consumers, complete directly related refactoring in the same change, and check for repeated data interpretation and unclear ownership; directly related means the defect or review comment cannot be correctly addressed without it, or this fix makes the code redundant or obsolete.
- After checking affected consumers, remove data representations, aliases, wrappers, code, and redundant tests superseded by this change, except during a transition requiring the old form while migrating in batches under [Git workflow](../chorus-git-workflow/SKILL.md#git-workflow).
- Record other refactoring and design problems unrelated to this defect as out-of-scope issues rather than including them.
- Passing regression tests does not prove the design problem is resolved; explain remaining related cleanup and its reasons.
- Before marking a review discussion resolved, explain the root cause, structural fix, validation results, and remaining cleanup.
