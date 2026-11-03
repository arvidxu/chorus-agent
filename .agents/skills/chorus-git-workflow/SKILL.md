---
name: chorus-git-workflow
description: Use for any Git or GitHub operation - staging, commits, pushes, branches, PRs, issues, comments, reviews - and when writing a commit message.
---

## Git workflow

Read and follow this section before any Git or GitHub operation (staging, committing, pushing, branches, PRs, issues, comments, or reviews).

PRs target the default branch. Branch naming: `<type>/<short-description>`, with the same type as the commit message and a lowercase English description with hyphens, for example `fix/session-recovery`.

- Serialize changes to shared Git state and isolate work when necessary, creating branches or worktrees only as the rule below allows; see "Working agreement" in [Working agreement and development process](../chorus-workflow/SKILL.md#working-agreement-and-development-process) for pre-task status checks and working-directory protection. When reviewing PRs, do not run `gh pr checkout`, `git switch`, or otherwise switch the worktree to the PR branch unless the user explicitly requests it.

- Do not create commits unless requested by the user; commits requested in this task do not require repeated confirmation (see [Permissions and security](../chorus-security-design/SKILL.md#permissions-and-security)).
- Aim for one complete behavior change per commit; dependency versions, tests, and related code may be committed together when inseparable.
- Specify paths explicitly when staging (`git add <path>`); do not use `git add -A` or `git add .`, and do not use `git add -f` to commit ignored files.
- Do not commit local plan files, temporary directories, build artifacts, or binaries.
- Before committing, run `git status` to confirm staging scope; commit only files modified by you or your delegated subagents in this conversation and already checked.

- Do not push or create PRs unless requested by the user; tag pushes also require authorization, with separate confirmation each time.
- Work in the user's current checkout and branch; create a branch or worktree only when the user or the task description asks for one.
- A request to open a PR counts as asking for a branch.
- When running in a worktree, modify only the current working directory, not the main repository checkout.
- Before each authorized commit or push, reconfirm the current branch; for pushes, confirm the target remote and branch rather than relying only on upstream configuration.
- If the correct branch cannot be determined, ask the user and wait for an answer; do not guess or silently choose an alternative branch.
- After an authorized push, check PR conflicts, CI results, and bot comments; if CI fails, analyze logs, fix and verify locally, and obtain another explicit instruction before pushing the fix.
- Inform the user when all checks pass.
- If a push is rejected, investigate remote changes first rather than force pushing.
- Place worktrees in `.worktrees/` at the repository root; it is ignored by version control and excluded from test, Lint, and type-check scans.
- After creating a worktree, run `pnpm install --frozen-lockfile` before checks.
- Clean up worktrees and branches you created after work is merged or abandoned by the user; first check for uncommitted and untracked files, ask the user if any exist, and do not delete with `--force`.
- Delete merged branches with `git branch -d`, which refuses unmerged ones; ask the user before deleting an unmerged branch.
- Leave worktrees and branches you did not create unchanged.

- Merging a PR or adding it to a merge queue requires explicit user approval for that PR in the current conversation.
- Do not infer approval from requests such as "prepare the PR", "get it ready", "follow its status", or "handle blockers"; agents may inspect status, fix code and CI, report readiness, and then wait for explicit instructions.
- Complete workflow-required reviews and merge checks, address substantive issues or explain why they are not adopted, but do not declare human review complete on the user's behalf.
- Verify remote operation results before reporting success or cleaning up; if a write outcome is uncertain, check first instead of retrying blindly.

- Do not skip Git hooks with `--no-verify` or similar methods; fix hook failures and commit again.
- Do not modify Git configuration on your own.
- Do not force push shared branches or branches already in a merge queue; only after the user explicitly requests removal from the queue and approves rewriting should you proceed under branch safety rules.
- Rewriting pushed history on an exclusive branch requires explicit authorization for that operation and `--force-with-lease`, never `--force`.
- Do not run `git commit --amend` on your own; when the user requests amend, check that the commit message remains accurate and update it if not.
- Changing a pushed commit message does not automatically update PR titles or descriptions; remind the user to synchronize them separately if a PR exists.

- Resolve conflicts only in files you modified.
- Do not rebase or merge merely because the main branch advanced; integrate only for conflicts, failed checks, or a specific risk, and rerun affected checks afterward.
- CI results for an old commit prove only that old commit.
- When changing a PR's target branch, replay only that PR's commits onto the new target and confirm the commit list and diff contain no unrelated changes from others.
- Worktrees share a stash stack; do not use `git stash pop` without arguments.
- When work must be set aside, prefer a WIP commit (still requiring authorization).
- Regenerate conflicting generated hash or fingerprint files rather than merging manually or choosing one version.
- Pushing a `<version>` tag publishes the artifacts of each platform whose version equals it: once any artifact for that version has been published to a non-overwritable destination such as npm, an app store, or a public GitHub Release, do not move or recreate the tag; increment the version after fixing and publish again.
- If no artifacts have been published, recreate a tag only with authorization and confirm the workflow files in the commit it points to.

### Commit messages

- Commit messages and PR titles use English Conventional Commits, with the title `type(scope): description`; type, scope, and description are required.
- Use the actual affected package, module, or subsystem name as scope, following existing repository names, not issue numbers.
- For repository-level files only, use `repo` for root build and workspace configuration, `ci` for CI and release workflows, and `agents` for rule files such as `AGENTS.md`; follow other existing repository names where present.
- Keep descriptions short and specific, using English imperatives, for example `fix(parser): reject empty input`; start with a lowercase word, preserve proper capitalization for proper nouns and identifiers, and omit a final period.
- Keep the title within 72 characters, preferably within 50.

- PR bodies, issues, and comments use English. Do not use emoji in commit messages, PR bodies, issues, or comments; new commit messages use ASCII punctuation and must not introduce characters such as em dashes, right arrows, or ellipses.

- Choose type according to the problem actually addressed by this commit: `fix` fixes defects; `feat` adds, adjusts, or removes features; `test` adds missing tests or corrects existing ones; `style` changes code style or formatting without changing behavior; `docs` changes documentation only; `build` changes build-related content such as build tools, dependencies, or project versions; `ops` changes infrastructure, deployment, CI/CD, backups, or monitoring; `chore` covers other maintenance; `perf` improves performance without changing externally observable functional behavior; `refactor` reorganizes code without changing externally observable functional behavior; `revert` undoes a previous commit.
- If the repository configures commit-message checks, their configuration determines allowed types.

- Every commit has a body after a blank line, saying what changed and why rather than how: one point as a plain sentence without a dash, several points as a short `-` list. Wrap the body at 72 characters. For bug fixes, name the root cause. Use concrete facts, without repeating the title, recording an activity log, or overstating unverified effects.

- Leave test plans and test results out of commit messages; report verification in the reply or the PR description (see [Testing and verification](../chorus-testing/SKILL.md#testing-and-verification)).

- Breaking changes use the title `type(scope)!: description` and a `BREAKING CHANGE:` footer describing incompatibilities, separated from the body by a blank line.
- Use accurate issue numbers when linking issues, and `Fixes` or `Closes` only when actually resolving them; write a separate closing keyword for each issue (`closes #1, closes #2`), since wording such as `Related` does not close issues.
- Do not `@` others in commit messages.
- Preserve existing metadata trailers when editing commit messages.

- Follow repository contribution rules for AI attribution: if they do not require attribution, do not add `Co-Authored-By`, "Generated with", or similar attribution. If disclosure is required, truthfully identify models and tools; write `unknown` for unknown versions rather than guessing. Agents must not add `Signed-off-by` on a person's behalf; DCO sign-off must be made by that person.

- When work goes through a pull request, use only one scope per PR. If a PR is too large to review or no single scope can be chosen, split it into independently reviewable and verifiable PRs; do not create intermediate states that cannot be independently verified merely to make PRs smaller.

- Exception for inseparable synchronized changes: when content that these rules require to be synchronized in the same change (contracts and implementations and callers, SDK types and examples, corresponding desktop and mobile features, and so on) cannot be split into independently verifiable PRs, one PR may cover several scopes and packages.
- Use the main affected package where the change originates (usually the contract or callee) as scope, list every affected package in the PR description, explain individually why splitting is impossible, and ask the reviewer to confirm the exception.
- Prefer splitting when preparatory changes without behavioral effects (such as new contract fields or new internal-package exports) can merge before behavioral changes.
- When mechanical changes across many callers (renaming, replacing shared types) must span multiple PRs, first add the new form while retaining the old, then migrate callers in batches, and finally remove the old form separately.
- Transitional dual implementations exist only within this PR series; state the plan for removing the old form in PR descriptions.
- Do not use this exception to combine unrelated changes.

### Commit and review practices

- PRs must address actually encountered problems or explicit user requirements: do not create PRs from speculative review-agent findings or batch issue scans.
- When an issue remains under discussion or awaits design, help clarify first rather than implementing directly.
- Before creating a PR, search open and closed PRs addressing the same problem or related scope and reference the results in the PR.
- If a duplicate PR exists, stop creation and inform the user; if a previous approach was closed, explain specifically how this approach differs and why it resolves what remained unresolved.
- Create PRs as drafts by default, do not request review until all checks pass, and let the user decide when to mark them ready for review.

- Before publishing GitHub issues, PRs, or comments on the user's behalf, obtain user review and explicit agreement.
- Do not present AI-generated content as human-written: no attribution by default does not mean denying agent involvement; disclose truthfully when asked or required by a PR template.
- Use corresponding issue and PR templates when provided: first read the complete template and title conventions, then answer every item truthfully and specifically, without blanks, placeholders, or generic summaries.
- Agents do not fill or modify sections reserved for humans; if validation fails, ask the user to complete them personally, and do not check responsibility declarations on the author's behalf.
- When publishing issue or PR comments with `gh`, write content to a temporary file first and submit with `--body-file`, rather than passing multiline Markdown through `--body`.

- Issue titles describe the problem or need itself: for defects, describe symptoms rather than a proposed fix; describe improvements to existing features and new capabilities in terms of improvement and support respectively.
- Keep issue and PR comments concise and technical, and write them as the user would, since they are posted under the user's account.
- Keep PR descriptions brief for readers who may not know this code, avoid internal abbreviations, and explain plainly who benefits, the previous problem, how the change resolves it, changed behavior, areas needing focused review, whether rollback is easy (data migrations, deletion, and external publication are difficult to reverse), possible affected scope, and checks actually run with results actually observed (paste key output into the test plan rather than replacing it with descriptions, including before/after comparisons when available).
- Unless reviewers explicitly need background, avoid long narratives, implementation activity logs, and per-file summaries.
- Before requesting review, read only the PR description (without the diff) and check whether it answers what was broken or missing, what users will see change, and how to verify it.
