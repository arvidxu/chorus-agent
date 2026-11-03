---
name: chorus-security-design
description: Use before issuing content such as commits, PRs, comments, logs, or screenshots; before destructive, external, or chargeable operations; when writing test data; and when writing or modifying code involving credentials, permissions and approvals, tool and command execution, file paths and subprocesses, sandboxes, network requests, encryption, database queries, data isolation and deletion, logging and telemetry, long-term memory, voice data, loading workspace configuration, rendering model output and web content, subagents and teams, unattended Goals, Workflows and scheduled tasks, installing and running plugins, MCP and skills, external Agent Runtimes, `sdk/client` local channels and remote connections, computer and browser control, application updates, Electron or system permissions, writing user configuration, CI workflows, or external JSON Schema.
---

## Permissions and security

Read and follow this section before issuing content such as commits, PRs, comments, logs, or screenshots; before destructive, external, or chargeable operations; when writing test data; and when writing or modifying code involving credentials, permissions and approvals, tool and command execution, file paths and subprocesses, sandboxes, network requests, encryption, database queries, data isolation and deletion, logging and telemetry, long-term memory, voice data, loading workspace configuration, rendering model output and web content, subagents and teams, unattended Goals, Workflows and scheduled tasks, installing and running plugins, MCP and skills, external Agent Runtimes, `sdk/client` local channels and remote connections, computer and browser control, application updates, Electron or system permissions, writing user configuration, CI workflows, or external JSON Schema.

- Do not disclose secrets, private data, API keys, or other credentials.
- Do not put private configuration, undisclosed model identities, authentication headers, Cookies, signed URLs, customer data, or sensitive information users provide in conversations into commits, PRs, comments, shared text, logs, conversation records, screenshots, or other media; check before issuing content.
- If required credentials are missing locally, stop the operation that needs them and ask the user; do not invent placeholder credentials.
- Environment configuration examples in documentation use placeholders only; do not commit local secret files.
- Do not put keys or tokens in command-line arguments (which enter process listings and logs); pass them through environment variables or credential storage.
- The exception is a one-time random password that a tool accepts only as an argument (such as macOS `security create-keychain -p`): generate it in the same step, mask it in logs, and delete what it protects when the step ends.
- Treat environment variable values as sensitive by default: do not print or log them, or persist the entire environment inherited by subprocesses in conversations or logs.
- If a secret leaks, stop its spread, privately inform the user and maintainers, and arrange rotation; removing it from code alone does not complete remediation.

- A user providing only a URL does not authorize modifying public content.
- Obtain explicit authorization for this task before modifying or restarting running services or state you did not create; performing destructive resets or cleanup (such as `git reset --hard`, `git clean -fd`, `git checkout -- .`, `git restore .`, or `git branch -D`); using `git stash`; deleting unrelated work; or performing operations with external effects or costs, such as publishing packages, pushing tags, sending messages, calling paid services, or modifying remote resources.
- Authorization covers only the operations and objects the user names, and does not extend to other targets or broader operations.
- Confirm each push, tag push, PR creation or merge, publication, and message separately; do not infer authorization from previous authorization.
- Commits requested by the user in this task (including requests such as "commit after each step") do not require repeated confirmation; advance requests for batch pushes (such as "push after every fix") still require confirmation each time.

- Use synthetic data for examples and tests, rewriting it according to the required properties rather than transcribing real material (when real protocol structure is needed, retain only protocol-defined structure from recorded responses, and rewrite all values such as content, identifiers, tokens, and timestamps): use reserved domains such as `example.com`, fictional identifiers, and obviously invalid tokens, without organization names, email addresses, internal IDs, or ticket content.
- When real data is needed for verification (such as data migration), operate only on a local copy; do not commit or transmit the copy or content derived from it.
- When copying or adapting external material, identify its source truthfully and comply with applicable licenses; do not claim reused content is newly written, and do not treat staying under some number of copied characters as a substitute for checking sources and licenses.

- Define trusted-source allowlists statically in deployment configuration; do not derive them from request URLs or headers.
- Do not weaken security controls to simplify implementation, pass tests, ease integration, or improve performance; documentation and answers must not present disabling authentication, TLS validation, sandboxes, or permission checks as routine solutions.
- If material issues remain unresolved in functional scope, operating permissions, side effects, or required verification, explain them and pause integration.
- Maintainers may decide to reduce scope, adjust the design, delay, or abandon integration, but cannot decide to integrate without required verification or security controls.

- When designing security measures, weigh specific risks against user operating costs, the risk of lockout, and lost functionality, and choose effective measures with the fewest restrictions.
- Keep risk paths explicit, let operators control them within the existing trust model and approval boundaries, and explain tradeoffs; do not add approval gates on your own.
- Do not remove validation at trust boundaries, error handling that prevents data loss, security measures, accessibility support, calibration code that real hardware requires, or user-requested content in order to shrink the change.

- Product security design continues in the reference files below, which are part of this section; read each one that matches the code being changed:
- [references/execution-and-network.md](references/execution-and-network.md): untrusted input, running external programs and model-proposed commands, sandboxes, URL and HTML handling, network access and application updates, long-term memory, and logs.
- [references/permissions-and-extensions.md](references/permissions-and-extensions.md): permission and authentication decisions, approvals, subagents and teams, unattended tasks, computer and browser control, plugins, MCP services, skills, external Agent Runtimes, and workspace trust.
- [references/credentials-and-data.md](references/credentials-and-data.md): the local channel and remote pairing, credential storage and encryption, data isolation and deletion, and writing configuration for other programs.
- [references/ci-and-schema.md](references/ci-and-schema.md): CI workflows and untrusted JSON Schema.
