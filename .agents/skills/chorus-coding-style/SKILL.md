---
name: chorus-coding-style
description: Use when writing or changing TypeScript or JavaScript, including scripts and tool configuration.
---

## Coding style

Read and follow this section before writing or modifying TypeScript or JavaScript code (including scripts under `scripts/` and tool configuration files).

The examples in this section only illustrate how to write code. Formatting such as quotes, semicolons, and indentation follows the formatter configured for the application or package.

### Language and scope of changes

- Use English for code and code comments, the corresponding language for translation resources, and no emoji in code; see "Commit messages" in [Git workflow](../chorus-git-workflow/SKILL.md#git-workflow) for the language and writing conventions for commit messages, PRs, issues, and comments.
- Code should look handwritten specifically for this repository, follow its existing coding style and architecture patterns, and show no traces of generic AI-generated code: unnecessary helper layers, vague naming, boilerplate comments, defensive branches without evidence of a real failure, broad rewrites, or disregard for the repository's existing style.

- Keep changes minimal and do not include unrelated changes in a PR; when unrelated changes are genuinely needed, obtain authorization for the corresponding task and open a separate PR.
- Do not rewrite accurate, clear comments just to phrase them differently, move code blocks, functions, or sections back and forth based on personal preference, or incidentally change unrelated whitespace, line breaks, or alignment; comment changes or reordering must serve a specific task (correcting incorrect or outdated explanations, removing explicit ambiguity, accompanying necessary structural changes, meeting formatting requirements, or carrying out the user's request).
- Synonymous rewrites, moving things, and increasing the diff do not count as progress.
- Before delivery, inspect the final diff item by item, remove unrelated formatting changes and changes with no practical benefit that you introduced, and preserve changes made by the user and other collaborators.
- Remove imports, variables, and functions made unused by this change; remove or unexport exports left without consumers by this change.
- Only report unrelated existing dead code or exports without consumers; do not incidentally remove them.

- Before writing new logic, check whether existing functions, components, IPC channels, state stores, and entire subsystems or flows can do the same work; if they can, extend the existing implementation or make it reusable rather than writing another one.
- If reuse requires adding flags or mode branches to a shared function solely for one caller, retain small-scale duplication as described in "Architecture boundaries" in [Design and interface contracts](../chorus-architecture/SKILL.md#design-and-interface-contracts).
- Do not prematurely extract helpers used only once or split simple expressions into many small functions; extract only when a function will be reused, encapsulates a complex boundary, or can express a real concept with an independent name and improve the readability of calling code, such as `requireConfig` or `readMetadata`.
- The main function should clearly show the normal flow; put validation branches and helper details in small functions below it.
- Keep helpers close to the code they serve, placing them below the main export when that improves readability.

- Update generated files through the generation process; do not manually modify generated files or `node_modules`.
- Files introduced by the shadcn CLI are treated as third-party source, not generated files; see [UI development](../chorus-ui/SKILL.md#ui-development).
- When a public protocol or service API has a corresponding generated client, run the generation process to update the client after changes.
- When generated files have merge conflicts, first resolve conflicts in templates and generators and then regenerate; do not directly accept either side of the generated result.
- Do not adjust formatter configuration for a single expression.

### Types

- When fixing static analysis problems, strengthen the real contracts or remove unsafe operations; do not hide problems with type assertions, broader types, marker types, or property probing.
- Do not use `any`; use `unknown` for unknown data, validate untrusted input with a schema at the receiving boundary, and narrow other data there.
- Do not use `@ts-ignore`; for genuinely unavoidable type exceptions, use `@ts-expect-error` with a reason, limit it to a single line under "Development process" in [Working agreement and development process](../chorus-workflow/SKILL.md#working-agreement-and-development-process), list it in the result or PR, and have a reviewer confirm it.
- Do not use non-null assertions `!` to hide potentially null values.
- New Lint rules must correspond to real invariants and have a clear scope of responsibility.
- Decode untrusted JSON with a schema rather than directly asserting a type after `JSON.parse`.

- Distinguish opaque IDs passed across boundaries with branded types rather than bare `string`; use literal union types for closed sets of values.
- Handle closed union types exhaustively with `switch`, and call a checking function that accepts `never` in the `default` branch so new members surface at compile time.
- For fields and events that a provider protocol explicitly allows to be extended, preserve unknown content in the adapter layer rather than discarding or rejecting it because the client does not yet recognize it; unknown content cannot directly become an internally validated type or determine authorization, execution, or recovery behavior.
- Prefer the project's existing type guards rather than inlining `typeof` or `instanceof` everywhere.

### Naming

- Use PascalCase for types, interfaces, classes, and enum members; use camelCase for functions, methods, properties, and local variables, using complete, meaningful words whenever possible.
- Prefix project-owned boolean variables, fields, and function parameters with `is`, `has`, `should`, or `can`; component props follow DOM and component-library conventions (such as `disabled` and `open`).
- Name numeric indices `index` and collection elements after what they actually represent; use single-letter variables only in narrowly scoped mathematical contexts such as `x` and `y`.
- Do not abbreviate names to save characters or shadow outer variables or built-in names (shadowing is checked by `no-shadow` in the root [.oxlintrc.json](../../../.oxlintrc.json) and `@typescript-eslint/no-shadow` in [apps/mobile/eslint.config.js](../../../apps/mobile/eslint.config.js)).
- Prefer named capture groups in regular expressions.

- Name code files after their main export: use PascalCase when the main export is a React component or class, and camelCase for other files (hooks, functions, types, constants, and state stores).
- Use kebab-case for directories, consistent with package directories, except `__tests__/` test directories.
- Test files use the tested file's name plus `.test`.
- Preserve framework-mandated filenames (Expo Router route files and `_layout.tsx`, and build-tool configuration files) and names of files introduced by the shadcn CLI; maintenance scripts under `scripts/` are invoked by path from workflows and use kebab-case.
- No paths in the repository differ only by case.
- Filename casing is checked by Oxlint `unicorn/filename-case`; exempt directories are listed in the configuration and their reasons in these rules.
- Review checks the distinction between components and other files, directory naming, and mobile files.

### Declarations, control flow, and functions

- Prefer type inference; add explicit annotations when exports or readability require them, and use `readonly` wherever possible.
- Export only types and functions callers need; do not add business types or values to the global namespace.
- Use a named options object when there are many parameters or multiple parameters of the same type.
- Do not mutate objects passed by callers; replace shared collections read concurrently as a whole rather than mutating them in place.
- Do not make synchronous logic `async`.
- Use `import type` for type-only imports and the `node:` prefix for Node built-ins; do not use `import("...")` in type positions, use import aliases only for name conflicts, and do not import the same dependency repeatedly.
- When moving or extracting symbols into another module, update all imports to point directly to their defining module and leave no forwarding exports in the original module, except during a transition that needs the old form while migrating callers in batches under [Git workflow](../chorus-git-workflow/SKILL.md#git-workflow).

- Use `const` by default; use ternary expressions or early returns instead of unnecessary reassignment and `else`.
- Use braces for loop and conditional bodies (checked by `curly` in the same Lint configurations); do not write nested ternaries, and use early returns or lookup tables when there are many branches.
- Avoid destructuring that hides which object a value came from (such as `const { name } = session` followed by uses of `name` far from `session`); read `session.name` so the origin stays visible.
- Destructuring props in React component parameters and tuples returned by hooks is conventional usage.

```ts
// Good
const mode = isReadOnly ? 'read' : 'write'
submit(session.id, session.title)

// Bad
let mode
if (isReadOnly) {
  mode = 'read'
} else {
  mode = 'write'
}
```

- Prefer `async`/`await` for asynchronous code, arrow functions for callbacks, and named `export function` for top-level exports, except files where the framework requires a default export, such as Expo Router route files, build-tool configuration files, and modules loaded by `React.lazy`.
- Use `bind()`, `call()`, and `apply()` only when required by an API or interoperability, not merely to bind `this` or prefill parameters.
- Dynamically import heavy modules needed only on some paths within the branch that actually uses them, bind named exports in the smallest required scope, then call them; do not write call chains such as `(await import(...)).method()` or `import(...).then(...)`.

### Dependencies, cancellation, and resources

- Declare a class's service dependencies in its constructor; components collaborate through public APIs, not by writing each other's storage keys to control behavior.
- Prefer direct calls for control flow between components, using events only to broadcast state changes and notifications.
- Register cleanup immediately after creating a disposable resource; for resources created in repeatedly callable methods, return their disposal handles for the caller to manage rather than accumulating them in the owning class.

- Potentially long-running asynchronous operations such as model calls, tool execution, network requests, and subprocesses must accept and pass down `AbortSignal` and set timeouts.
- After cancellation, produce no new side effects and release occupied resources; when canceled, throw by calling `signal.throwIfAborted()` rather than returning silently.
- Add listeners to `AbortSignal` with `{ once: true }` and remove them when the task ends; define listener functions separately and capture only needed variables to avoid long-lived signals retaining entire request bodies.
- Retry only retryable errors with a backoff strategy, without repeating non-idempotent side effects.

### Errors and logging

- Default behavior should produce usable, understandable results, and eliminating silent failures comes first: every operation has a visible outcome, and intentional cases with no outcome must be recorded.
- Use typed, structured errors: distinguish failures by error type or code, not error-message text; use `TypeError` for invalid argument types and `RangeError` for out-of-range values, and do not throw bare `Error` in product code.
- Convert caught values to `Error` before reading their information rather than writing `(e as Error).message`.
- Write error messages as complete sentences.
- Messages that cross a process or package boundary or reach users (such as IPC and CLI responses, interface errors, and configuration and input validation at the receiving boundary) explain who handles the problem, its scope of impact, guarantees after failure, and the next action; messages of internal invariant guards state the violated condition and the actual value.
- Do not concatenate fragments, add wrapping text with no new information, or expose sensitive data.
- Stop work dependent on failed results and explicitly report untrusted state or operations with unknown results.
- Keep warnings and hints brief and explain how to respond; remove noisy or misleading messages rather than compensating with more logs.
- Preserve existing error handling and validation when moving or merging code.

- Catch exceptions only when there is an explicit handling or fallback plan, catch specific error types, and do not write empty `catch` blocks; propagate other errors to the responsible request or task boundary.
- Leave no unhandled Promises and do not discard results of calls that can fail.
- Use `null` only for documented absence (such as a successful lookup with no record), not to hide failure; use one failure convention per layer rather than mixing `ok`, `valid`, and bare `{ message }` forms.
- Expose to clients or interfaces only error codes registered in the error-code definitions and safe information, not raw exceptions, stacks, queries, credentials, or request content.
- Do not hide invalid state with defaults, silently recover from programming errors, or add fallbacks when early failure is possible.
- Failures to write telemetry or metrics must not affect the main flow; throttle logs for high-frequency events (every frame, keystroke, or streaming chunk) or use the lowest log level.

- Product code logs through interfaces provided by `packages/observability/logging`, without direct `console.*` calls, except user-facing terminal output in the CLI and TUI, maintenance scripts, and tests. Remove temporary debug output, `debugger` statements, and debugging probes before delivery.

### Configuration

- Read URLs and parameters that vary by deployment environment through a unified configuration entry rather than hardcoding them in business code; define deployment-adjustable parameters as validated configuration fields, while keeping protocol constants, externally specified values, and security invariants fixed.
- Validate independently checkable configuration at load time and configuration dependent on other information at the earliest point it can be judged; report configuration errors explicitly rather than silently skipping missing referenced objects.
- Configuration is owned by process: product configuration is read and written by `services/configuration` in the execution host; other host-side packages read through configuration interfaces defined in `contracts` and injected by the composition entry. When multiple hosts run simultaneously, serialize writes through database transactions or file locks, and let other hosts detect modifications through database or file changes; see [chorus-persistence](../chorus-persistence/SKILL.md).
- The renderer reads and writes product configuration and subscribes to changes through the configuration interfaces in `sdk/client`; it does not save preferences or state in browser `localStorage`, listen to `storage` events, or directly import Node.js-side packages.
- The main process separately stores only settings required before window creation (such as window position and dimensions) and the desktop client's own update state (skipped and downloaded versions, automatic checks), which is separate from host updates, without writing to the database; product configuration needed by the main process (such as interface language) is read from the host through `sdk/client`, using the system language before the host is ready.
- Mobile stores local preferences such as language and paired computers in local settings storage, and secrets in system secure storage. Settings needed by the CLI before starting the host (such as the Node.js path and a user-specified data directory) come from command-line arguments and environment variables.

### Cross-platform code and blocking calls

- The desktop main process, host-side code, and Agent core must run on multiple operating systems: join and resolve paths with `node:path` rather than handwritten separators; do not assume case-sensitive filesystems, fixed `\n` line endings, or a particular shell being present.
- Put platform-specific behavior in the corresponding capability package under `packages/platform/`.
- The renderer does not directly handle filesystem paths: file operations go to the execution host through `sdk/client`, and only window capabilities such as native file dialogs go to the main process through preload.
- The execution host computes the application data directory using the algorithm in `packages/platform/filesystem`, independently of Electron's `app.getPath()`: desktop and CLI hosts on the same channel (development, prerelease, release) use the same directory, with different channels isolated from each other.
- Users can specify another directory through a command-line argument or the `CHORUS_HOME` environment variable; the command-line argument takes precedence when both are present.
- The launcher forwards only directories explicitly specified by the user, not directories it computed itself; use `CHORUS_HOME` pointing to isolated directories for development and testing.
- Obtain user home and packaged-resource paths through unified path functions, without hardcoding `~` paths, directly calling `app.getPath()` or `os.homedir()` in business code, or relying on `__dirname` to locate resources; business code accesses files through `packages/platform/filesystem`.
- Scripts detect the default branch dynamically rather than hardcoding branch names such as `main`.

- Do not use synchronous blocking calls for potentially time-consuming operations in asynchronous code; in particular, do not use `fs.*Sync` or `execSync` in the Electron main process.
- `node:sqlite` has only synchronous interfaces and is used under the persistence rules in [chorus-persistence](../chorus-persistence/SKILL.md).
- Bound concurrency: when running operations in parallel (such as `Promise.all` over a list whose length depends on input), limit how many run at once.
- When replacing a running executable or application bundle, rename the old file out of the way before writing the new one, or use atomic renaming; do not overwrite in place.
- Identify processes by recorded PID or process handle, not by matching substrings of command-line arguments.

### File size limits and generated files

- Human-maintained code files must not exceed 800 physical lines (including comments and blank lines); functions must not exceed cyclomatic complexity 20, block nesting 6 levels, or length 300 lines, with no exception baselines.
- When a file approaches the limit, put new responsibilities in corresponding modules called by the original file.
- Do not evade limits by compressing formatting, deleting necessary comments, or moving mixed logic into another large file; limit splitting to the current task's required scope.
- `pnpm lint` checks line and complexity limits (the Oxlint and mobile ESLint rules `max-lines`, `max-lines-per-function`, `complexity`, and `max-depth` in the root [.oxlintrc.json](../../../.oxlintrc.json) and [apps/mobile/eslint.config.js](../../../apps/mobile/eslint.config.js)) and is integrated into project validation and CI; report file paths, actual line counts, and allowed limits for violations.
- Distinguish generated artifacts, third-party source, and pure data files from human-maintained logic, listing excluded paths and specific reasons; do not broaden exclusions or label business logic as generated to bypass checks.
- Run checks before delivery and verify the resulting responsibilities, dependency directions, and behavior; shorter files alone do not prove splitting is complete.

- Generated files carry header comments identifying their source and forbidding manual edits (a comment line beginning with `@generated` within the first five lines); review confirms that regeneration leaves no differences. Files introduced by the shadcn CLI are third-party source and exempt from this rule. Do not alphabetically reorder data, configuration, steps, or test fixtures whose order is meaningful.
