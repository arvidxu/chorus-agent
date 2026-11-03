---
name: chorus-testing
description: Use when writing or running tests, changing mocks or development data, verifying a change before delivery, reporting completion, handling CI failures, or measuring performance.
---

## Testing and verification

Read and follow this section when writing, modifying, or running tests, modifying mocks and development data, verifying changes, reporting completion, handling CI failures, or measuring performance.

### Development data and mocks

Rules for shared mocks and development-data scenarios are in [references/development-data-and-mocks.md](references/development-data-and-mocks.md). Read it before adding or changing mocks or development data.

### Test requirements

- Before adding tests, inspect existing organization and tests covering the same feature, and extend the corresponding suite rather than arbitrarily appending to a file.
- Use `describe` and `test` consistently with existing tests.
- Before adding a test, identify the specific incorrect behavior it catches that existing tests do not; otherwise do not add it, since low-value committed tests increase maintenance burden.
- Test the actual implementation without duplicating implementation logic in tests; run new or modified tests and correct tests or implementation until they pass.
- For new features, cover only the main flow and important edge cases, rather than creating matrices for every option, alias, or combination.
- Use one test per behavior and table-driven tests (`test.each`) for multiple inputs to the same behavior; if describing behavior requires continually more tests, simplify the implementation first.
- Make fixtures and arguments explicit in tests rather than using helpers that hide inputs.

- For behavior-changing work (new features, bug fixes, or behavior adjustments), write tests first by default: write one test describing the target behavior, confirm it fails because that behavior is missing (not because of typos or environment errors), then write just enough implementation to pass.
- Advance one behavior at a time, rather than writing all tests before implementing them together.
- Pure refactoring, configuration, style, and copy changes are exempt; refactoring requires tests to pass both before and after the change.

- Tests must be capable of failing for reasons reviewers care about.
- Do not write tests for property forwarding, getters, generated code, or coverage numbers; do not write snapshots merely recording current output, tests asserting only that mocks were called, tests recomputing expected values the same way as implementation, or tests merely asserting that output lacks error words.
- Assert user-visible behavior or public-interface results, not internal state, hook call counts, or the sequence of implementation steps, and do not rely on exact log text or positions.
- Prefer testing at existing public interfaces at the highest practical level, without bypassing interfaces to verify results (for example, directly querying a database instead of reading through the interface).
- Do not separately assert constant values or other content that changes only intentionally; test dependent behavior instead.
- When testing scripts and configuration, run them and assert output, side effects, or exit codes, rather than asserting that source files contain a particular line.
- Do not test mechanisms already guaranteed by frameworks or dependencies; test only this repository's agreements at their boundaries.
- Distinguish "not found" from "failure" in tests.
- Do not wait for conditions with `setTimeout` or `await sleep(N)`; use polling with a deadline or wait directly for the corresponding event.
- Subprocess tests assert output before exit codes to aid diagnosis on failure.

- Verify bug fixes with one or two tests of the broken behavior, ensuring they fail before the fix because of that defect (assertion failure, not import, spelling, or environment errors), pass afterward, and are committed with the fix.
- If the fix is already written, temporarily remove it to confirm failure, then restore it; also update and run all affected caller tests.
- Generalize reported cases into meaningful regression tests; only behavior that once worked and later broke is a regression.
- For GitHub issue regression tests, put the real issue number in a nearby comment.
- When changing lifecycles, choose applicable regression tests; where the corresponding phases exist, cover cancellation before connection establishment completes, cancellation during final cleanup, combinations of subtask outcomes, and cleanup retries.
- Testing only cancellation during execution cannot establish correct final cleanup.
- If valuable automated tests are difficult for pure copy, style, or configuration fixes, new tests may be omitted, but explain the verification actually used.

- Tests describe behavior; passing tests do not prove that the behavior is correct.
- When behavior intentionally changes, update affected assertions, case names, and comments to the new contract and explain why in the PR; do not simply delete coverage.
- When removing features, remove only cases covering that feature and retain adjacent assertions; do not add tests asserting its absence.
- Rename, move, merge, split, or delete test files with source files, keeping names consistent with covered code; fix or remove test files whose source no longer exists or whose names no longer correspond.
- Remove mocks for nonexistent exports, constants, flags, and helpers, rather than retaining assertions that pass only because of outdated stubs.
- Update snapshots only for intentional output changes, inspecting the snapshot diff first; review each newly generated snapshot like handwritten expected values before committing.
- Update only intentionally changed test files, not bulk acceptance for the whole project.
- CI does not write snapshots; missing or outdated snapshots fail checks.
- Generate and compare screenshot baselines only on a fixed platform and environment; do not compare screenshots on other platforms.
- Do not use tests already failing for unrelated reasons as a reason to leave new inconsistencies; report those failures separately and confirm whether this change affects their results.

- Do not add test-only switches that change business behavior, export private implementations, or add test-only hooks in production modules.
- Supplying substitutes implementing real interfaces through normal dependency injection is exempt; use fake clocks for time-related logic.
- Window presentation (hidden, shown without activation) is selected through launch configuration, effective only in unpackaged test builds, and is not business behavior.
- Do not add test infrastructure (new runners, screenshot comparison frameworks, or mock layers) for bug fixes unless maintainers request it.
- Fixtures contain only the minimum fragments needed for tests, not complete copies of changing source files.

- Do not skip unexpected error states (such as 401, 429, or 5xx) with early returns; these must fail assertions. Do not delete a test whose purpose you do not understand; do not modify examples or schemas to accept behavior the implementation should reject; do not increase global test timeouts or hide flaky tests with retries. Confirm CI actually runs added tests; empty results when filtering tests by name count as failure.

- Before delivery, run new or modified tests involving timing, concurrency, subprocesses, windows, or networking (excluding E2E) locally at least 10 consecutive times with retries disabled, with every run passing; explain if repeated runs are impossible.
- Do not use wall-clock thresholds to judge performance or progress in tests; assert countable results such as operation counts or rendered rows, or choose inputs that necessarily time out on regression.
- Measure performance comparisons separately under "Performance".

- Skip tests by platform only when the platform actually lacks the tested capability, documenting that missing capability in a nearby comment; do not hide timing issues with platform skips. Declare E2E platform scope in project configuration or tags, not runtime skips within cases.

- After completing tests, perform a mutation self-check: imagine common production-code mistakes (wrong constants or arguments, wrong branches, omitted state changes or side effects, null or default returns, missing validation for null or unauthorized inputs). Each must fail at least one test; if none would fail, add coverage or report that the behavior is unprotected.

### Test organization

Where tests and fixtures live, how tests isolate state, ports, and user directories, the network and filesystem rules, and end-to-end locators are in [references/test-organization.md](references/test-organization.md). Read it before adding or changing a test, a fixture, or an end-to-end case.

### Do not disturb the foreground

The configuration requirements for Electron, browser, and mobile tests are in [references/do-not-disturb-the-foreground.md](references/do-not-disturb-the-foreground.md). Read it before adding, changing, or running a test that launches an application, a browser, or a simulator.

### Running tests

The commands for one test, related tests, a package's tests, single-file checks, and the full suite are in [references/running-tests.md](references/running-tests.md). Read it before running tests or verifying a change.

### Verification discipline

- Before delivery, run formatting checks and Lint for changed files and tests for modified packages; passing Lint and formatting does not prove correct behavior.
- For documentation-only changes without behavioral effects, review the diff and run `pnpm exec remark <file> --frail --quiet` and `git diff --check HEAD -- <file>` on changed documents (check whitespace errors and conflict markers separately for new untracked files); code tests are unnecessary.
- If documentation contains code examples, commands, or links, check under [Documentation](../chorus-documentation/SKILL.md#documentation) that examples type-check, commands match actual scripts, and links target existing destinations.
- Use the repository's own type-check commands, not temporary single-file configurations that may miss project type augmentations and pass locally while CI fails.
- Do not skip required checks under time pressure; explain specific blockers.
- Once behavior is verified and all required checks pass, finish the task or merge as authorized, without adding optional verification, demonstrations solely to check boxes, or speculative scope expansion.

- Report checks actually run and those left to CI, distinguishing observations, source-code inferences, assumptions, and planned checks; do not claim reproduction or measurement without actually performing it. Do not exaggerate completed work or actual usable effects in commits, PRs, or user messages.

- Before fixing behavioral defects, reproduce end to end from the actual failing entry point (for pure copy, style, or configuration fixes, explain the verification used under "Test requirements"); verification bypassing relevant boundaries is not proof.
- If real hardware, external services, or intermittent races prevent end-to-end reproduction, explain why, reproduce at the closest level to the actual entry point, and mark uncovered parts unverified.
- When fixing policies or validation logic, invoke actually registered callbacks with representative native inputs and assert that callbacks actually use the fixed logic, avoiding helper-only tests that miss real wiring.
- Check each verification: could it pass with the original issue still unresolved?
- Environment setup failures cannot establish product behavior; explain what remains unverified.
- Simulated providers cannot prove real-provider behavior for conclusions involving providers.

- Before fixing failures, distinguish product defects, incorrect test expectations, detector or fixture defects, and startup or environment failures; retain original failures.
- When investigating test failures, inspect isolation first, then mocks, then fix implementation; change tests only if they are wrong.
- For E2E evaluation failures, run the same evaluation on the baseline branch and confirm it also fails before calling it preexisting; if the baseline cannot run, state that its relationship to this change is unverified and list it as a PR risk.
- While fixing failures, maintain one current list recording known failing cases, logs, source revisions, confirmed causes, and minimum checks proving fixes; reconcile the runner's total failure count, including unhandled errors and module-loading failures, not just named-test summaries.

- When GitHub Actions fails, inspect the failing job first; obtain authorization before reruns and rerun only failed items, preserving successful jobs unless the failure cause requires reverifying them. After code fixes are authorized for commit and push, check CI for the new commit rather than rerunning the old SHA. Without push authorization, complete local verification and report remote checks as unverified; do not push on your own to run CI.

- For visual changes (layout, styles, icons, animation, or visible copy), provide before/after screenshots in the conversation before merge or completion, inspecting and removing sensitive information first.
- Have the user attach them to the PR; if not attached, list interfaces and states needing manual checks in the PR.
- Render the affected surface in a headless browser for these screenshots; checks that need a visible window run on a virtual display or CI and are otherwise reported as locally unverified, as in "Do not disturb the foreground".
- If screenshots are unavailable in the current environment, explain why and list interfaces and states requiring manual checks, without claiming visual verification.
- When modifying tool calls, model requests, or result presentation, verify tool-card and reply rendering in the real interface, including failure states; provider request-error fixes require before/after conversation comparisons, which unit tests do not replace.
- If comparisons incur costs, have the user run them or obtain authorization first under "Communication style" in [Working agreement and development process](../chorus-workflow/SKILL.md#working-agreement-and-development-process); mark them unverified if unavailable.
- When modifying lifecycle code such as updates, migrations, configuration, or plugin loading, verify upgrades from the latest stable release if one exists; otherwise report the upgrade path as unverified.
- After changing packaged artifacts, generated scripts, or configuration, perform actual compilation or execution checks (such as `node --check`); successful field readback does not prove files usable.

- When the project explicitly assigns acceptance cases, expected results, or evaluation fixtures to an independent verification party, implementers use them read-only under their maintenance agreement.
- Report inconsistencies or missing coverage to the corresponding maintainer for revision; do not change expectations to match current implementation.
- Requirements needing both product and acceptance-standard changes must separately identify who changes each, their basis, and review responsibility; implementers do not alter completion criteria on their own.
- Ordinary unit tests, integration tests, and fixtures still update with behavior changes.

- Reuse passing verification when relevant inputs and environment are unchanged, retaining original sources and marking evidence as reused.
- Before reusing the results of a review run by a model, check that its fully expanded prompt, scoring criteria, parameters, and dependencies are unchanged; a different commit ID alone does not invalidate results, and convenience does not justify rerunning the same passed review with another launch configuration.
- Save full build or test output and extract needed information from it rather than rerunning tests merely for different filtering.
- Before checks dependent on an edit or environment setup, confirm that operation's outcome; if editing failed, do not retest unchanged inputs as a substitute for verifying modifications.


### Performance

When and how to measure performance, and what to report, are in [references/performance.md](references/performance.md). Read it before measuring or claiming a performance change.
