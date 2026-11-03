# Roles

The roles below are optional templates for dividing work, not mandatory steps; see ["Agent collaboration"](../SKILL.md#agent-collaboration) for creation conditions, task descriptions, and return requirements.

| Role | Applicable scenario | Provide | Return |
| --- | --- | --- | --- |
| `planner` | Before complex features and refactors | Requirements, repository constraints, and related code | Phased implementation plan, dependencies, risks, and verification methods |
| `architect` | Architecture decisions needed | Existing structure, goals, and constraints | System design, module responsibilities and interface boundaries, tradeoffs, and extensibility impact |
| `tdd-guide` | New features or defects needing regression tests | Expected behavior, defect reproduction, and related implementation | Test scenarios; guidance through tests first, implementation next, then refactoring; tests and actual execution results |
| `code-reviewer` | After completing cross-module changes, changes involving public interfaces, or higher-risk changes | Requirements, diff, and verification results | Issues, file locations, and reasons using the review scope and severity levels in [chorus-code-review](../../chorus-code-review/SKILL.md) |
| `security-reviewer` | Security-sensitive code involved | Related code, data entry points, and permission boundaries | Vulnerability locations, trigger conditions, and repair requirements |
| `build-error-resolver` | Build or type-check failures whose causes cannot be located directly | Failed command, complete errors, and related changes | Stepwise fixes with verification after each, changes made, and execution results |
| `e2e-runner` | Key user flows | Acceptance scenarios, execution entry points, and test environment | Passing items, failed steps, and evidence after actually executing flows |
| `loop-operator` | Running autonomous loops | Task goals, current progress, execution state, and stop conditions | Identify and handle stagnation, failures, and blockers; return reasons to continue or stop |
| `harness-optimizer` | Adjusting harness execution and verification framework configuration | Configuration and reliability, cost, and throughput records | Configuration adjustments and verification evidence |
| `agent-evaluator` | Evaluating agent task completion quality | Task requirements, agent output, and execution evidence | Completion status, evidence gaps, and quality issues |
| `silent-failure-hunter` | Reliability audits | Related execution paths and error-handling code | Swallowed errors, missing error propagation, and impact |
| `type-design-analyzer` | Type design reviews | Type definitions and call sites | Encapsulation and invariant issues |
| `pr-test-analyzer` | Before merging PRs | Requirements, changes, and tests | Coverage quality, completeness, and missing scenarios |
| `code-explorer` | Understanding unfamiliar code paths | Behavior, entry points, or issues to understand | Relevant files, call relationships, and architecture explanation after tracing execution paths |
| `spec-miner` | Extracting specifications from existing implementation | Existing code, documentation, and functionality to cover | Specifications extracted from existing implementation and matters needing verification |
| `refactor-cleaner` | Code maintenance | Scope permitted for this cleanup | Dead-code cleanup changes and verification results |
| `doc-updater` | Documentation updates | Behavior changes and related code | Updated documentation and code structure diagrams |
| `comment-analyzer` | Code comment reviews | Comments and corresponding implementation | Inaccurate, outdated, or fragile explanations and revision suggestions |

- The lead assigns implementation tasks using planning and architecture results, rather than leaving multiple implementers to guess an unresolved design independently.
- Send issues found by reviews and specialist checks to implementers for repair, then recheck according to the corresponding scenario.
- Exploration, specification extraction, specialist reviews, evaluation, and cost optimization results cannot replace actual tests and product acceptance.
- A harness is the framework that organizes agent execution, passes context, runs checks, and controls stop conditions.
- The lead checks results from cleanup, documentation, and other roles against task scope, without using those roles to clean up unrelated code or expand the task.
