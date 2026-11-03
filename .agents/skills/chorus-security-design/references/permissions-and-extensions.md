# Permission decisions, approvals, delegated and unattended work, extensions, and workspace trust

- Product permission and authentication decisions deny on missing information, errors, or timeouts; incomplete evidence does not pass.
- Deny approval requests with no recipient able to respond; do not approve by default.
- Approval replies received after cancellation or timeout no longer take effect.
- Approval interfaces display the actual command, arguments, or diff to be executed, rather than only a model-written summary; persistent rules such as "always allow" specify their scope and can be viewed and revoked by the user.
- Evaluate credential authorization obtained through login separately from tool execution approval; locally restored login state does not mean a remote token remains valid.
- Login flows that save credentials report success only after credentials are successfully written, and return cancellation and failure separately.
- When implementing security boundaries such as credentials, approval, tool or command execution, and external side effects, use the responsible party's currently valid authorization, rechecking it after asynchronous waits and before the actual operation; matching tokens, signatures, validity periods, or IDs alone cannot establish that authorization remains valid.
- Internal bookkeeping such as scheduling, acknowledgments, history, and caches is idempotent, so replaying an entry does not repeat its side effect, and the authorization check happens at the actual operation rather than when the entry was recorded.

- Subagent and team member permissions may only inherit or narrow parent-task permissions, never expand them.
- Unattended Goals, Workflows, and scheduled tasks use only the permission snapshot generated and shown to the user when the task is created or edited; saved "always allow" rules apply only if the user includes them in the snapshot.
- On each run, snapshot permissions remain subject to subsequent user revocation, changes in workspace trust, and credential invalidation; revocation takes effect immediately.
- Permissions separately approved for the task and included in the snapshot do not expire merely because they were not saved as "always allow" rules. Deny operations beyond scope and notify the user; do not automatically approve them. Also set cost, duration, and iteration limits; stop and notify the user when a limit is reached.
- Computer and browser control operations require individual approval or execution within a user-defined scope; treat screen, web, and file content as untrusted input that may contain prompt injection.
- Browser control uses a separate browser profile, does not read Cookies or saved passwords from the user's default profile, and does not fill in credentials on the user's behalf.
- Untrusted web pages displayed in Electron are isolated from the application interface and receive no preload interfaces.

- Before installing or enabling plugins, MCP services, and skills, show their source and requested permissions and obtain user confirmation.
- Third-party plugins and local MCP services are equivalent to arbitrary code execution and run in restricted processes: `platform/sandbox` isolates these processes, which receive only explicitly granted files, network access, and credentials.
- If the platform cannot provide isolation or the required runtime is unavailable, refuse to load them and report a clear error; the command-execution exception in [execution-and-network.md](execution-and-network.md) allowing execution after user enablement does not apply, and they must not run instead in the execution host, main process, or another unisolated process.
- They do not inherit host credentials and use capabilities only through host-authorized interfaces.
- External Agent Runtimes likewise run in restricted processes, receiving only dedicated credentials the user authorizes for them or having the host forward their model requests; they do not inherit other credentials or the entire environment.
- Map their permission requests to Chorus's approval flow; Runtimes unable to integrate with approval run only within the user-defined scope. Treat output as untrusted input.

- Before the user trusts a workspace, permission rules, MCP services, Hooks, plugin and skill configuration, and other executable settings in workspace files do not take effect; workspace configuration may only tighten user-level permissions, never relax them. Project instruction files in untrusted workspaces are supplied to the model only as untrusted content and cannot change permissions or approval.
