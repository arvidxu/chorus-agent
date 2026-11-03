---
name: chorus-documentation
description: Use when changing code comments, README files, docs, examples, AGENTS.md and other rule files, skills or prompts, or when documenting commands.
---

## Documentation

Read and follow this section before modifying code comments, documentation, READMEs, examples, rule files such as `AGENTS.md`, skills, or prompts, or documenting commands.

### Comments

- Comments and documentation must state the complete conventions and context, rather than recording reasoning processes; use direct, concrete wording without metaphors.
- Before using words such as "contract", "boundary", or "shape", consider whether a more precise name exists, such as response fields, JSON validation, or ESM exports: use "contract" only for actual obligations such as preconditions, postconditions, invariants, and compatibility commitments, and "boundary" only for actual process, communication, security, transaction, or lifecycle divisions.
- Do not narrate control flow, restate tests, preserve review history, or repeat code; retain facts needed to understand behavior, failure, timing, ownership, and safe use, and link to the rationale.

- Comments explain only non-obvious constraints and easily misunderstood behavior, relate to nearby code, and do not restate obvious assignments or control flow, expand unrelated comments, or explain distant behavior.
- Comments worth keeping include non-obvious invariants, issue numbers and sources, constants that should not be adjusted casually, diagrams, and enumerated cases the code must not break.
- Comments do not record change history, conversations, or task background (such as "previously X, now Y", "changed for a task", or "AI:" annotations); put these in commit messages and PRs.
- Comments explain current behavior and real compatibility constraints, without past-oriented wording such as "preserve existing behavior".
- State the same fact or rationale only where the reader first encounters it or where shared code resides, rather than repeating it in configuration files, manifests, the code reading them, or each call site.
- Existing verbose comments are not precedents to imitate; when a brief comment loses useful information, that information usually belongs in code structure, tests, commit descriptions, or documentation.

- Use JSDoc for public interfaces called across modules and behavior not apparent from signatures (nullability, side effects, units, return-value ownership), not functions whose names explain everything.
- Keep JSDoc concise; do not repeat types (do not write `{type}`) or default values already in the signature, and put fuller explanations in the package README.
- Inline comments must not exceed two lines; when more explanation is needed, first check whether implementation can be improved or the explanation can go in the package README, but do not delete necessary constraint descriptions.
- Do not write section-divider comments.
- Delete comments describing code when deleting that code.
- Correct inaccurate, outdated, or ambiguous comments within related tasks; modify only comments you wrote or those near the lines being modified, without using a fix to clean up existing comments incidentally.
- Brief TODOs describe the specific follow-up work missing, include a tracking issue number when available, and do not change other people's TODO attribution.
- New code comments use ASCII punctuation and do not introduce characters such as U+2014 (em dash), U+2192 (rightwards arrow), or U+2026 (horizontal ellipsis); leave existing content unchanged.
- See "Commit messages" in [Git workflow](../chorus-git-workflow/SKILL.md#git-workflow) for commit-message punctuation requirements.

### Documents and README files

- Documentation and README changes must be concise, accurate, and relevant to the behavior changes in this task.
- When changing code, update conventions in affected READMEs, interface documentation, and in-code interface documentation such as JSDoc in the same PR, update related examples, and confirm consistency with implementation and tests.
- Update documentation when moving internal symbols.
- When no release or review baseline needs preservation, maintain current documentation in place rather than saving V1, V2, V3 copies or incrementing revision numbers.
- Maintain published documentation or review baselines explicitly required to be preserved according to their recordkeeping rules, without overwriting history.
- Use wording such as "current format" when describing general data-format behavior; retain the corresponding version numbers when referring explicitly to particular interfaces or data formats, migration inputs and outputs, historical evidence, and version-specific tests.

- Each app (`apps/<app>/`) and capability package (`packages/<domain>/<capability-package>/`) has a `README.md` at its root; provide it in the same PR when creating an app or capability package.
- Do not write separate READMEs for domain directories; their responsibilities follow the directory tree in [Project structure and architecture](../chorus-architecture/SKILL.md#project-structure-and-architecture).
- Subdirectories with independent builds, native code, or external sources that need listing (such as models or datasets) may have their own README.
- READMEs address developers and agents using and maintaining the app or package, and state: what the package is and is not responsible for; public entry points (`exports` subpaths) and main usage; who assembles it and which dependencies the host must inject; runtime and platform requirements; package-specific commands and execution directories; constraints, failure behavior, and security assumptions users must know; and, when needed, source layout (responsibilities of main directories and entry files) and links to related ADRs.
- READMEs do not contain change history, audit or acceptance progress, commit hashes, or task records, and do not restate dependency and script lists directly available in `package.json`.
- Rules governing only agent working practices belong in the `AGENTS.md` in the same directory.
- The root README contains only a product introduction, environment preparation, development entry points, and documentation links; details of individual capabilities belong in the corresponding package README.
- All READMEs are written in English; those for npm-published packages (`@chorus/sdk`, `@chorus/cli`, and their platform subpackages) address external users and contain only installation and usage, and the maintenance information above goes in an English `DEVELOPMENT.md` in the same directory (except workflow-generated platform subpackages, whose READMEs are generated from templates).
- When changing public interfaces of `sdk/agent` or `sdk/client`, update the README in `packages/sdk/bundle` as well.
- Review confirms that every app and capability package has a complete README.

### Markdown and examples

- Documentation links point to existing files or routes, follow routing and language conventions at the destination, and retain valid language paths and localized anchors.
- When referring to specific repository files in Markdown, use relative links with repository-root-relative paths as link text, such as `[docs/agents/testing.md](testing.md)` in `docs/agents/`; do not format file paths as code.
- Continue using code formatting for wildcard paths, paths with placeholders, generic filenames (such as each package's `package.json`), directories, paths in commands, and planning files not yet created; change references to links once planning files are created.
- Code examples in documentation come from compilable source files and pass type checking (except snippets in rule files labeled as syntax illustrations), with import paths matching real exports.
- Example programs must run against real hosts or provider services, use only public APIs, read credentials and configuration from environment variables, and contain no debug output or temporary bypasses.
- Use wording resistant to becoming outdated for tool or feature counts, rather than hardcoded numbers.
- When a capability provides both environment variables and arguments, keep names, descriptions, examples, and multi-value formats consistent in documentation.
- Change descriptions explain changes users or developers can perceive, rather than substituting implementation perspectives such as "pass a configuration" or "modify the runtime"; list specific design token names when involved.
- Do not force-wrap Markdown prose to a fixed column width; keep each paragraph on one line and preserve lists, tables, code blocks, and intentional hard breaks.
- Use a trailing `\` for hard breaks rather than trailing spaces; use Mermaid when diagrams are needed.
- Use tables only for data comparing three or more attributes; use lists, description lists, or subheadings for single-column content, paired keys and values, or cells needing full-sentence explanations.
- Use compact tables: write separator rows as `| --- |`, leave one space on each side of cell content without alignment padding, and start and end each row with `|`.
- Split a paragraph or list item longer than 2000 characters at a sentence boundary into separate paragraphs or items, because the read tools of some agents truncate longer lines.
- Review checks table formatting and the 2000-character line limit.

- Do not replace model names in documentation or examples merely because you do not recognize them: the user may be using a newer model, and different names may refer to different models. Before writing or updating model names, verify current model IDs against the provider's official documentation rather than relying on memory or caches. Handle default parameter values in published code separately under compatibility requirements; do not modify them incidentally as documentation updates.

### Rule files

- Maintain general repository rules in `AGENTS.md` at the applicable level.
- Do not automatically overwrite existing content in rule files such as `AGENTS.md` or `CLAUDE.md`; make targeted updates when repository workflows change.
- For compatibility with other tools, use references actually supported by that tool (such as `@AGENTS.md` in `CLAUDE.md`) or symbolic links.
- Tool-specific files retain only necessary entry points and tool-specific settings; do not copy general rules or assume all tools support the same reference or automatic-loading mechanisms.
- Commit agent tool configuration only when the tool documents it as shared project settings (such as `.claude/settings.json` for team hooks and permissions); keep personal editor and agent settings (such as `.vscode/` or `.claude/settings.local.json`) in version-control-ignored local or user-level configuration, and give a tool the entry file that references `AGENTS.md` instead of copying rules.
- The exception is configuration generated by an application's framework template, which stays as generated and does not receive repository rules; review verifies both.

- When a review correction is a general rule rather than a one-time opinion, add one or two lines with an example to the corresponding `AGENTS.md` in the same PR.
- Delete rules that no longer match the code; rules inconsistent with code are worse than no rules.
- This does not apply to rules for the planned structure under "Project structure" in [Project structure and architecture](../chorus-architecture/SKILL.md#project-structure-and-architecture) or for files marked as not yet created: confirm with the maintainer before removing those.
- Rule files retain stable directory ownership, responsibilities, and dependency directions; put frequently changing symbol lists and file-by-file implementation descriptions in the corresponding package README.
- New rules explain the problem to avoid and prioritize stating what to do; wherever possible, pair prohibitions with alternatives. Identify existing automated check entry points, or explicitly state that review verifies the rule if none exist.
- Do not restate facts directly available from `package.json`, configuration files, or `--help` in rule files unless lookup is costly (for example, common commands spanning multiple packages); record conventions, reasons, and pitfalls not discoverable in the repository.
- When automating conventions, prefer Lint rules integrated into CI; do not add unnecessary tool hooks that increase latency for coding assistants (this does not restrict product execution lifecycle Hooks).
- Each rule must be independently understandable and link to higher-level documentation; keep the wording compact without losing clarity.
- Follow documentation budgets (the root `AGENTS.md` must not exceed 200 lines).
- When necessary content does not fit, first remove duplication and outdated content; if it still does not fit, explain why and let the maintainer decide whether to adjust the limit.
- When agents misread a workflow passage, read that passage and the sources it cites in full, resolve every identified ambiguity in ordering, definitions, ownership, and approval at once, rewrite dense instructions as executable steps, and walk through the whole process; rewording alone does not show that the workflow is clear.

- Write team and project knowledge, such as architecture decisions, API changes, and runbooks, into the project's existing documentation structure.
- When the current task has already produced related documentation or code comments, do not duplicate it elsewhere.
- When no clear documentation location exists, ask before creating new top-level files.
- Write ADRs only when requested, under `docs/adr/` (with sequentially numbered filenames such as `0001-slug.md`), following its guides.
- When a decision made in a change could be questioned by an engineer twelve months later (typically a decision that is hard to reverse, surprising without context, and involves tradeoffs among real alternatives), point it out in one sentence so a person can decide whether to record it.
- When the project maintains a domain glossary, use its terms in code naming, test names, documentation, and UI text.
- When users, code, or documentation use inconsistent terms for the same concept, point it out and confirm before continuing.

### Skills and prompts

- Use Markdown for skill documentation, clearly distinguishing when to use it, how it works, and examples.
- Put skill trigger conditions in the frontmatter description because the body loads only after triggering.
- The description states only when to use the skill, without summarizing the workflow, or the model may follow the summary without reading the body.
- The body contains only what the model does not know and uses imperatives; skill directories contain only necessary files, without duplicate content for different agents.
- Skills must not hardcode output formats conflicting with the host, and specify only the evidence required.
- When modifying tuned, built-in product system prompts, skill instructions, or other text affecting Chorus model behavior, demonstrate improvement with the agent behavior evaluation described in [Evaluation, check gates, and background execution](../chorus-delegation/SKILL.md#evaluation-check-gates-and-background-execution), which also states what to record while no evaluation script is registered.
- Prompt tests lock only bytes read by the program and the meaning of safety-critical constraints, without locking wording character by character.

### Commands in documentation

- When documenting commands in `AGENTS.md`, guides, or other documentation, specify the execution directory, complete executable command, required arguments, environment prerequisites, and applicable scope, and keep them consistent with actual project scripts, tool configuration, or task definitions.
- Do not substitute natural language such as "run tests".
- Distinguish read-only checks, autofixes, continuous watching, and one-time execution, and retain trigger conditions.
- Do not document unconfirmed commands or project facts; confirm with the maintainer first rather than inventing commands or claiming they were verified to run.
