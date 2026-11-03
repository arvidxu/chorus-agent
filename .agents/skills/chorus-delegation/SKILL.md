---
name: chorus-delegation
description: Use when spawning subagents, splitting work by role, running a plan-implement-evaluate loop, evaluating agent results, handling tasks that come from evaluation failures, scorers, benchmarks or traces, designing check gates, or running long background evaluations.
---

## Subagent roles and iterative process

Read and follow this section before creating subagents, dividing work by role, or adopting an iterative planning, implementation, and evaluation process.

### Agent collaboration

- The lead is the agent that directly receives the user's task and is responsible for the final result.
- The roles in "Roles" in this section are optional templates for dividing work, not mandatory steps: create them only when the current environment supports subagents, the task matches the corresponding scenario, and delegation is worthwhile.
- The lead completes simple, single-file, or tightly coupled changes directly.
- Without delegation, the lead performs checks according to the corresponding roles' responsibilities and delivery requirements and explains which checks were done in the result.
- Follow "Test requirements" in [Testing and verification](../chorus-testing/SKILL.md#testing-and-verification) for test-first development; when using `tdd-guide`, have it provide guidance under those requirements.

- Delegate independent work to subagents for parallel execution when it saves time or improves verification; the lead remains directly involved, verifies important conclusions, and is responsible for shared working directory safety.
- Role names only identify divisions of work and do not replace task descriptions; when no preset with the same name exists, create the role according to the responsibilities in the "Roles" table.
- Do not leave multiple implementers to guess an unresolved design independently.
- Task descriptions specify the goal, current and expected behavior, relevant requirements and code locations, assigned scope and editable files, explicit exclusions, applicable rules and skills, prerequisite results, expected deliverables, and acceptance methods.
- Do not attach the lead's conversation history; pass large materials through file paths.
- Subagents must not create further subagents unless their task description explicitly permits it.
- Assign related failures to one executor to investigate together rather than splitting them across subagents.
- Parallel subagents work in the lead's current working directory by default, only for read-only work (exploration, review), or changes in different packages whose respective checks will not read files another agent is editing.
- Before delegation, the lead assigns each subagent non-overlapping editable files; only one executor may modify a file at a time.
- Serialize changes that would otherwise be parallel within the same package; when parallel work is truly necessary, explain why under [Git workflow](../chorus-git-workflow/SKILL.md#git-workflow) and obtain user consent before using separate worktrees.
- Subagents do not commit, push, or switch branches; the lead checks all work together and commits after authorization.
- Start tasks depending on other results only after receiving the required inputs; run mutually independent, non-conflicting tasks in parallel.
- Independent checks wait only for their actual dependencies, rather than serializing all verification because of unrelated failures.
- Keep source read by running tests or builds (including source referenced through symbolic links) unchanged during execution.

- On completion, subagents return actual results, files or features involved, check commands and results, evidence locations, unresolved issues, and reasons for blockers.
- The lead checks deliverables against actual diffs and check output rather than accepting report conclusions.
- After combining multiple subagents' results, check for conflicting changes and run affected tests before deciding to proceed or return for repairs.
- Mark checks not run as unverified and tasks lacking acceptance evidence as incomplete.
- Subagent completion claims or scores, as well as exploration, review, and evaluation results, cannot replace actual tests and acceptance.

- Development tasks needing multi-stage collaboration proceed in this order: clarify requirements and verification goals -> planning and necessary architecture decisions -> tests and implementation -> code review and applicable specialist checks -> repairs and rechecks -> acceptance and delivery.
- Simple tasks may omit inapplicable stages, but not verification and acceptance.
- Pass planning, review, and evaluation outputs to the next executor; do not skip prerequisite results for steps with input dependencies.
- Address build problems first when builds fail; return to implementation and tests when acceptance fails, and rerun affected checks after changes.
- Finally, the lead checks requirements, actual changes, tests, and remaining issues before reporting completion status.

### Roles

The optional role templates (when to use each, what to give it, and what it returns) are in [references/roles.md](references/roles.md). Read it when choosing roles for delegated work or checking work against a role's responsibilities.

### Planning, implementation, and evaluation loop

- Use a repeatedly iterative planning, implementation, and evaluation process when requested by the user, or when the task needs multiple rounds of implementation and independent evaluation (such as complete functionality of an interactive product or acceptance criteria requiring actual execution) and the lead judges delegation worthwhile; explain the reason in the plan.
- The loop assigns implementation and evaluation to different agents; the lead handles scheduling, handoff, and final acceptance.
- Before starting, the lead defines task scope, acceptance criteria, evaluation methods, and iteration or resource limits.

- Create `iteration-planner` and provide user requirements, repository constraints, and existing specifications; it returns a feature list, key user flows, edge scenarios, implementation phases, and executable acceptance criteria for both implementation and evaluation.
- Reuse existing complete specifications and acceptance criteria directly; fill gaps first when missing, rather than allowing the two sides to adopt different criteria.
- Create `iteration-implementer` and provide specifications, acceptance criteria, allowed modification scope, and complete feedback from the previous round.
- In the first round it implements to specification; in subsequent rounds it fixes all feedback item by item rather than selecting easy items.
- Each round returns actual changes, execution or startup instructions, a version available for evaluation, known issues, and self-check results, and ensures the app or service needed for evaluation is available.
- Implementers may self-check, but cannot decide they passed on behalf of evaluators.

- Create `iteration-evaluator` independently of the implementation role, and provide the same specifications, acceptance criteria, version to evaluate, startup instructions, and known issues.
- Before evaluation, confirm tools and environment actually available, and check normal flows, boundary inputs, and error states item by item: actually operate running interactive products, and execute appropriate requests, tests, and builds for APIs or libraries.
- Return check steps, expected and actual results, evidence locations, issue severities, repair directions, and improvements or regressions since the previous round.
- When scoring is needed, use established criteria; do not present screenshots, code reading, or implementer statements as executed interactive verification.
- When tools are unavailable, report the checks actually completed and unverified scope; mark unfinished acceptance as incomplete.

- The lead returns all failed items and their evidence to `iteration-implementer`, then passes repairs to `iteration-evaluator` for verification and checks for regressions.
- When iteration or resource limits are reached, progress persistently stalls, the environment blocks execution, or the user requests stopping, end the round and report remaining issues and incomplete items; stopping does not mean passing.
- Report completion only when agreed acceptance requirements and necessary checks actually pass; do not use a passing total score to hide unfixed defects.
- Final delivery includes implementation results, verification evidence, iteration results, and remaining limitations.

## Evaluation, check gates, and background execution

Read and follow this section before evaluating task completion by Chorus Agent or other agents, handling tasks originating from evaluation failures, graders, benchmarks, traces, or result files, designing or modifying check gates (CI checks, acceptance scripts, hooks, etc.), or running lengthy background evaluations.

Follow "Verification discipline" in [Testing and verification](../chorus-testing/SKILL.md#testing-and-verification) for verification in ordinary development tasks.

- Agent behavior evaluations cover product system prompts, tool descriptions, skills, and other text affecting model behavior, and run from the repository root through the evaluation script registered in `package.json`.
- While no such script is registered, record in the PR which cases were checked by hand and mark the change as not evaluated.
- The evaluation calls real models and incurs costs: model credentials are required (provided through environment variables; see the script's `--help` for variable names).
- Under "Communication style" in [Working agreement and development process](../chorus-workflow/SKILL.md#working-agreement-and-development-process), the user runs it by default.
- When the user asks the agent to run it, first explain the expected cost and required credentials; mark it unverified when it cannot run.

- When evaluating agent tasks, project tests controlled by the evaluated target itself count only as self-reported results; label them `self_reported` in evaluation records rather than treating them as independent verification evidence.
- Mark independent verification as passed only with evidence of completion obtained independently of the evaluated target, such as a check the evaluator ran itself.
- When evaluation fails, do not manufacture passing results by lowering thresholds, increasing model budgets, skipping cases, or rejudging; a review panel fixed before the evaluation started does not count as post hoc rejudging.

- When tasks originate from evaluation failures, graders, benchmarks, traces, or result files, do not add branches, prompts, comments, text, or behavior serving only the evaluation in order to pass it.
- Do not add multiple naming variants (such as case or underscore aliases) for the same semantic field to "support the evaluation", unless the alias is already a documented public contract.
- Before committing, inspect the staged diff to confirm there is no evaluation-specific wording or disclosure of internal files.

- For each check gate, confirm when its required inputs exist, check normal execution, skipped or unavailable execution, and subsequent changes, and identify circular dependencies and check bypasses. Integrate mechanically checkable invariants into top-level checks that actually execute, and demonstrate that every modified acceptance path rejects invalid cases. When exceptions are needed, limit their scope and explain why rather than disabling rules globally.

- Before an agent evaluation starts, declare which interactions the simulated counterparts in fixtures (such as a scripted user or approver) support; their replies and permission decisions stay within that declaration.
- Attribute produced artifacts to a run through the same isolated state (such as its isolated data directory) that is passed to its subprocesses, not merely through paths found in the environment.
- Execution supervision covers every case and its configured retries, without omissions in local or CI runs.
- Before paid evaluations, also check the programs required by the actual launcher, isolated state, necessary display environment, explicit test layers, selected cases, and expected execution count, and use runtime versions pinned by the workflow and container image.
- Run a no-cost smoke check in the same launch environment to confirm the required tools can actually execute; version and authentication checks cannot replace execution verification.

- Preserve command exit status for every attempt in logs; cases skipped or not yet started do not count toward coverage.
- During long runs, check the last public tool result and pending permission state, first investigating whether the execution role is blocked rather than simply waiting for timeout.
- When running background evaluations, continually check execution state and wait for the runner to explicitly report an exit marker and results, or stop at the user's request.
- No output does not mean success and does not justify ending the wait early.
- If a process terminates without an exit marker or reliable completion record, mark the result "incomplete", not successful or verified; when results are explicit, distinguish passed, failed, and canceled.
- When a fix changes inputs used by an ongoing evaluation, cancel that run, preserve completed results, and mark unfinished cases canceled; record cancellation separately from test conclusions.
