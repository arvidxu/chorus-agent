---
name: chorus-agent-runtime
description: Use when changing the Agent loop, sessions, session events, tool schemas, provider adapters, or model catalogs.
---

## Agent runtime, tools, and providers

- Domain plugins register tools, context contributions, and lifecycle handlers through public interfaces, without modifying the Agent loop or bypassing permissions and execution environments.
- Plugins use only the public plugin SDK and manifest metadata; they do not read core internals or other plugins' private files.
- Isolate and report plugin errors at the plugin boundary without crashing the host or session.
- Before adding model-visible core tools, first consider plugins, skills, or MCP: core tool definitions remain in every request's context and impose ongoing costs, so a single new integration is insufficient reason to add a core tool.
- Tools declare input and structured-result contracts; programs read result fields rather than parsing identifiers or state from presentation text, and the corresponding interface adapts user-facing presentation.
- The SDK exposes capability composition, session operations, and event interfaces, allowing callers to select the model, tool, extension, and storage implementations they need without depending on the desktop entry.

- Within a session, system prompts, tool definitions, and existing history depend only on session and configuration facts.
- History is append-only and not rewritten, with exceptions only for context compaction and edits, rollbacks, deletions, and imports explicitly initiated by the user: compaction, edits, and rollbacks write new session events rather than modifying existing events in place.
- Sessions imported or restored from exports or backups are written as new sessions; their approval and permission records do not take effect, and their content is treated as untrusted input.
- Continuing an existing session in the same database is not such an import or restoration.
- Deletion and clearing remove original event content and derived data under [Permissions and security](../chorus-security-design/SKILL.md#permissions-and-security), retaining only content-free deletion records.
- Put information that changes each turn in that turn's messages; generated context content is bounded and deterministically ordered to preserve prompt caching.
- All model inputs (except deleted content) must be reconstructible from session records: record corresponding session events whenever adding model-visible input.
- Persisted events record only new facts that cannot be derived again; put derived state in projections or read models.

- When modifying the Agent loop, session lifecycle, event types, or context compaction, check serialization, recovery, and historical replay, and update SDK types, examples, and corresponding tests in the same change; normalize and validate session content before importing or restoring it from exports or backups.
- Update snapshots and generated documentation together with tool or MCP-tool schema changes; validate publicly declared JSON Schema against its declared dialect and actual clients.
- When changing MCP or OAuth implementations, check the repository's pinned supported protocol-specification version; to support a newer version, first read its release notes and update the pin to a concrete version, not `latest`.

- When adding or modifying tool input schemas, define string fields with fixed allowed values listed in their descriptions (modes, protocol types, switches, and so on) as enums rather than strings with explanatory text alone; keep user-defined identifiers, paths, commands, search terms, and open values returned by backends as strings, without mistakenly narrowing examples introduced by "for example" into enums.
- Derive enum values from public documentation or existing stable constants; when the contract is unclear, retain an open type and explain it in the result.
- Regenerate allowlists and configuration dependent on the tool list when adding, removing, or renaming tools, so new tools are not silently filtered out.

- Confirm provider field names, timeout units, lifecycle defaults, or credential behavior against documentation, generated types, and narrowly scoped real calls run under the real-provider rule in "Communication style" in [Working agreement and development process](../chorus-workflow/SKILL.md#communication-style).
- Before calling cloud services or third-party platforms, consult official documentation for interface capabilities, parameters, authentication, response structures, and limits; do not implement from memory, and prefer the official SDK when it has a corresponding method.
- When modifying conversion logic shared by multiple adapters, run tests for every dependent adapter.
- Explicitly report unavailable models or tools rather than silently switching to less capable models or fallback paths; execute valid parameters explicitly supplied by users as given even if results may be poor, rejecting them only when they would cause failure or security problems.

- Model lists, model capabilities and reasoning levels, account and subscription state, external Runtime options, and project and session lists all come from traceable sources: live provider or Runtime discovery, version-pinned catalog snapshots shipped with releases, user configuration, or user-created data.
- Interfaces and protocols must be able to distinguish these sources and the data's update time.
- Catalog snapshots serve only as fallbacks for the corresponding provider and do not appear under other providers or accounts that are not signed in.
- On discovery failure, preserve the last successful result and report failure; do not treat failure as an empty list or fill it with placeholder or example data.
- Display external Runtime options (such as ACP `configOptions`) as declared; clients do not hardcode their models or reasoning levels.
- Use model IDs entered by users normally even if absent from the catalog; mark capability fields without reliable sources as unknown.

- The adapter layer sends requests exactly as constructed by the caller, without independently merging, reordering, adding defaults, or discarding fields; do not send `null` for values to be omitted, and treat empty lists as valid values rather than missing.
- Environment variables must not override values explicitly set by callers.
- Do not revalidate content reliably rejected by public contracts or providers when no local risk arises before rejection; still check local limits invisible to providers and security, privacy, persistence, or resource risks that may arise before rejection at the responsible boundary.
- Do not fail because of unrecognized new fields, enum values, or event types: handle known cases and pass unknown content through unchanged, especially in streaming and middleware.
- When parallel implementations exist (such as two versions of a streaming interface) and their contract requires consistency, fix both in the same change.

- On startup, authentication, and message-loading paths, reuse already loaded user and configuration data; do not read data serially when reads are independent, and initiate independent reads in parallel.
