---
name: chorus-interface-contracts
description: Use when changing a public interface, protocol, configuration option, schema, compatibility path, or deprecation.
---

## Interface contracts

- Callers depend on declared interfaces and return contracts, not on which concrete backend implementation is selected underneath.
- Preserve existing calling conventions when modifying functions; do not change required parameters, parameter order, return types, side effects, or error behavior unless all affected call sites and shared interface contracts are updated together.
- When an implementation needs extra helper values, provide them through private helpers or clearly named dedicated methods rather than changing a public method's return contract.

- Validate unknown data once at the boundary responsible for receiving it, then pass explicitly typed values inward; do not repeat `typeof value === "object"`, property-existence checks, or defensive validation for values already guaranteed by schemas, constructors, or internal types.
- Normalize third-party or upstream return conventions at integration boundaries so core code receives the project's expected types and structures rather than handling return-structure variants from different models or providers; do not unwrap in callers with forms such as `out = out[0]` unless the called interface explicitly returns that structure.

- When project-owned configuration, requests, events, and persisted data need runtime parsing, define them with Zod in their owning module, putting cross-package shared protocol definitions in the corresponding `contracts` package.
- Maintain one authoritative schema per data kind, derive TypeScript types from it, and have callers reuse it rather than writing equivalent interfaces and validators; do not create duplicate schemas merely for uniformity for same-process data already guaranteed by internal types.
- Use the returned value after successful parsing; distinguish input and output types when transformations or defaults are involved, and use asynchronous parsing for asynchronous validation or transformation.
- Maintenance scripts that run before dependencies are installed (such as release steps) validate configuration with hand-written checks that stop on missing or invalid values, instead of Zod.

- When exporting tool parameters, structured results, or public JSON Schema from project-owned schemas, derive them through generation rather than manually maintaining a second definition: export input definitions for parameters and output definitions for results, specifying the target JSON Schema dialect and the actual consumer's supported scope.
- Explicitly handle unrepresentable types or constraints rather than hiding conversion failures with empty schemas, arbitrary types, or discarded checks.
- After modifying definitions or generation configuration, inspect generated diffs and verify acceptance and rejection behavior in actual consumers.

- When external services, MCP, or plugins supply raw JSON Schema, use Ajv at the responsible receiving boundary to validate the schema against its declared dialect, then validate actual data against it; schema validity does not establish parameter or result validity.
- Each input definition explicitly specifies policies for additional fields, defaults, and type conversion: closed structures reject undeclared fields, while extensible structures preserve unknown fields required by the protocol.
- Do not automatically delete fields, fill values, or convert types to pass validation; perform protocol-required conversions and defaults only at their owning parsing boundary without changing validation behavior for other callers.

- Before retaining compatibility code, confirm a specific basis: an explicit user request, or an existing contract concerning public APIs, configuration, SDKs, data, stable-release upgrades, security and migration, dependencies, or actual production usage; specify the migration or removal path.
- When confirmed unreleased, with no external consumers, old data requiring preservation, other established compatibility obligations, or user compatibility request, modify the current implementation directly and update callers, tests, and documentation together; do not add compatibility branches, old-interface aliases, or dual implementations for hypothetical historical versions.
- Missing Git history or release records establish only a lack of evidence, not that something was never released or used.
- When all callers are internal repository packages, update them directly together; when evidence is missing for externally released packages (such as `@chorus/sdk`), cross-client protocols, or persisted data, treat compatibility as required and confirm with the maintainer.
- Add compatibility parameters, flags, properties, or constructor options only when current code actually reads them and they change current behavior; delete values merely passed through or stored unused.
- When compatibility is explicitly unnecessary, delete aliases, duplicate nodes, old entries, and prearranged wrappers retained solely for compatibility, leaving no multiple paths performing the same operation (except transitions migrating callers in batches under [Git workflow](../chorus-git-workflow/SKILL.md#git-workflow)).

- Do not reorder or renumber enum values and status codes with existing external or persistence compatibility commitments; append new values only.
- Keep ID formats compatible when clients have saved them and must continue reading them.
- Repository-owned protocol responses use objects rather than top-level arrays to allow field extension; collection interfaces support pagination, and search runs on the host rather than filtering a page of data on the client.
- Determine defaults once at the boundary responsible for parsing requests, not implicitly inside execution functions.
- When deprecating public interfaces, use `@deprecated` to identify alternatives and migrate callers; the deprecation period is at least one minor-release cycle: before 1.0, remove in a subsequent minor version; after 1.0, remove only in the next major version, with advance notice in release notes.
- Do not add public SDK APIs or options without explicit needs; explicitly flag public-signature changes in the result.

- Identifiers written to user configuration (menu-item IDs, panel and docking-position keys, and so on) are persisted identifiers and remain stable.
- When adding configuration options, account for older files missing the key: use the declared default when absent rather than language zero values; centralize defaults in configuration definitions rather than patching them item by item at startup, and keep existing behavior through new options' defaults.
- For partial configuration updates, omitted fields retain their values, while `null` restores defaults; boundary types must distinguish these cases.
- The root [.env.example](../../../.env.example) and [.env.variables.example](../../../.env.variables.example) are the templates for GitHub Actions secrets and repository variables: list each with a placeholder, grouped by purpose, and keep actual values in untracked copies.
- Do not put application runtime variables in them.

- When changing features shared by desktop and mobile (menus, toolbars, dialogs, interactions, and their event handling), inspect the corresponding mobile implementation.
- When the user's request applies to both, update both in the same task; when the user requests only one or limits scope, do not independently modify the other, and explain their differences in the result.
- If changing only one would make their protocols, data, or behavior inconsistent, explain the blocker and request a scope adjustment under "Working agreement" in [Working agreement and development process](../chorus-workflow/SKILL.md#working-agreement-and-development-process).
- If no corresponding mobile feature exists or the change applies only to desktop, explain why in the result.
- Do not infer the current client's platform from the remote host's reported platform; obtain client and host platforms separately.

- Entries that may run outside Node, such as `@chorus/sdk/client`, do not import Node-only modules, access `process` at module top level, or hide imports from bundlers through variable paths, `webpackIgnore`, or similar means; consumers supply Node-only capabilities. Public type changes affecting only type checking can still break consumer builds; avoid them where possible and explain unavoidable ones in the PR.

- Version numbers for data models, protocols, and persisted formats distinguish read/write and migration contracts, not the number of code changes.
- Do not increment format versions for comments, internal naming, documentation revisions, or implementation adjustments that leave read/write contracts unchanged and preserve data meaning and safe reading behavior.
- When existing discriminants can no longer prevent misinterpretation between old and new data, or an established migration process requires registering a new schema version, update under that process, explain specific changes, affected readers and writers, and migration methods, and check the authoritative current-version definition and existing baselines.
- Manage product versions, data-format versions, and documentation revisions according to their respective bases rather than incrementing other numbers merely because one changes.
