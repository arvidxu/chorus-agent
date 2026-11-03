# Untrusted input, command execution, sandboxes, and network access

- Chorus executes operations proposed by models.
- Product code treats model output, tool results, web and file content, and data returned by MCP services and plugins as untrusted input that may contain prompt injection.
- Permission decisions and approvals are enforced in host-side code, without relying on prompts to constrain the model or elevating permissions because of instructions in that content.
- Before file operations, resolve real paths (including symlinks), then confirm the target is inside the authorized workspace; if the target does not yet exist, resolve and check its existing parent directory.

- Product code passes argument arrays when calling external programs, without concatenating shell command strings; user- or model-provided text is passed only as arguments, never interpolated into command strings.
- The Agent command execution tool intentionally passes model-proposed commands to a shell; treat these commands as untrusted input: obtain approval through `agent/permissions` first, run within isolation provided by `platform/sandbox`, and restrict the working directory and inherited environment variables.
- Do not substitute escaping or "sanitization" that changes command semantics for approval and isolation.
- When the current platform or execution backend cannot provide a sandbox, deny execution by default; run only after the user explicitly enables it in the current conversation and approves each operation.
- Product code places user- or model-provided values passed to external programs after `--`, validates that they do not begin with `-`, or passes them as `--name=value` to prevent interpretation as options.
- When launching `.cmd` or `.bat` on Windows, first resolve the actual executable or script and launch it directly; if parsing through `cmd.exe` cannot be avoided, use the repository's shared escaping implementation and reject arguments containing metacharacters.
- Do not execute user-controlled strings with `eval()` or treat `node:vm` as a secure sandbox for untrusted code.

- Redact credentials before writing them to logs, telemetry, conversation records, or model context; telemetry does not collect user content such as prompts or file content unless the user has explicitly enabled the corresponding option.

- Model or user code executed in sandboxes does not access host credentials; requests requiring credentials are made by the host on its behalf, and sandbox outbound networking is restricted by default.
- Process isolation is provided by operating-system mechanisms in `platform/sandbox`; command-rule interception, file copies or worktrees, and copied conversation history do not restrict process access and must not be called sandboxes.
- When restoring or rebuilding sandbox sessions, treat persisted session state as untrusted, prefer trusted configuration, and clean up mounted secrets on every failure path.

- Before requests, validate the protocol and destination of URLs constructed from model output, tool results, or external responses to prevent access to internal networks or unauthorized addresses.
- Sanitize HTML when rendering model output, tool results, and web content; do not automatically load resources such as remote images.
- When the user clicks to load such a remote resource, the host validates and retrieves it under the URL rules above; the interface does not access the address directly.
- Display the real address before opening a link.

- The product does not access the network without the user's knowledge: new external requests such as telemetry, update checks, and downloads require clear user controls and privacy explanations.
- Application updates verify the code signature of signed builds; builds without code signing install an update only after its SHA-512 matches the published update metadata.
- Enable code signing for mobile OTA updates; download large files such as models and plugins only when initiated or authorized by the user.

- Filter high-risk secrets and injection content before writing long-term memory. Logs do not record user content such as message bodies or tool inputs and outputs; when exporting conversation data externally, process and redact a copy without modifying original conversation records. Do not bypass provider safety refusals by automatically switching models.
