---
name: chorus-code-review
description: Use when reviewing a diff or PR, choosing reviewers, rating finding severity, or responding to review comments.
---

## Code review

- Determine reviewers through existing project code ownership rules; when `CODEOWNERS` is used, route reviews according to its declarations. Involve listed code owners for restricted paths, security-related paths, or substantive changes.

- Review the complete diff against the target branch's merge base, not just the latest increment, and base conclusions on the actual pushed commit.
- Distinguish newly introduced issues from existing problems in unchanged context, listing existing issues separately rather than among changes the author must fix in this PR.
- Also review against requirements, separately listing missing or partially completed requirements, added behavior outside requirements, and requirements seemingly implemented but implemented incorrectly; judge unmentioned cases by a reasonable user's expectations.
- Treat conclusions and design reasons in author reports as reference only; rely on the diff and check results, and do not lower severity because of a rationale.
- List each behavior not assessed because it was out of scope and explain why.
- Review comments address defects, incorrect logic, security issues, regressions, interface contract violations, and missing required tests; include files and line numbers, triggering scenarios, and actual caller-visible consequences, and report only issues with concrete consequences on supported paths.
- Present confident findings as comments and uncertain ones as questions to confirm, not defects.
- Raise maintainability issues only when they have concrete consequences; do not summarize code functionality, suggest refactors unrelated to PR goals, report formatting or Lint issues CI catches, or demand consistency across paths solely for symmetry or appearance.
- Read author replies before reviewing again, and do not repeat matters already rejected for scope reasons. List findings by severity first, then questions and assumptions; explicitly say when no issues are found and identify remaining risks or test gaps. Record the reviewed revision, scope limitations, and checks run; completing a scan does not mean issues have been eliminated.

- Severity: `CRITICAL` means security vulnerabilities, data loss or corruption, crashes, or unavailable main flows; `HIGH` means incorrect behavior on supported paths, broken contracts, or missing required tests; `MEDIUM` means concrete consequences with limited impact or a workaround; `LOW` means maintainability issues that do not affect current behavior but increase future change costs or misuse risk.
- When delivering your own changes, fix `CRITICAL` and `HIGH` before delivery; fix `MEDIUM` or explain in the result why it is not fixed; the lead (defined in [Subagent roles and iterative process](../chorus-delegation/SKILL.md#subagent-roles-and-iterative-process)) decides `LOW`.
- Reviewers and review subagents apply these levels, and the lead rechecks according to definitions and actual consequences rather than accepting labels directly as triage conclusions.
- Rare appearance or layout issues requiring new state to fix may be listed as known limitations; this exemption does not apply to crashes, data loss, weakened security, or user-reported issues.
- Fixes repeatedly introducing new state across review rounds are themselves an issue to flag.

- When addressing review comments, verify each against the code first.
- If any items are unclear, clarify all unclear items before editing because they may be related.
- Confirm first when comments conflict with existing user or maintainer decisions.
- When advised to "complete" a feature, first search its actual callers; if there are none, propose removal rather than expansion.
- Explain and reject technically incorrect comments.
- Modify and verify item by item; obtain user review and explicit agreement on reply content before replying in the original comment thread.
