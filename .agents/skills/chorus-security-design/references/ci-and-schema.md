# CI workflows and untrusted JSON Schema

- Treat metadata such as PR titles, descriptions, and branch names as untrusted input, and code not yet reviewed and merged (including agent-generated code and new or upgraded dependencies) as unreviewed code.
- CI does not expose secrets or writable tokens to jobs running unreviewed code, or interpolate PR metadata directly into shell commands.
- Set explicit, minimal `GITHUB_TOKEN` permissions and pin third-party Actions to full commit SHAs.
- When running agents in CI, grant only tools needed for the task and do not skip or weaken security checks.
- Do not add triggers such as `pull_request_target` that run PR code with privileges, or suppress corresponding security checks.
- PR runs only build and verify; package or version publication is triggered only through the entry point registered in [Releases](../../chorus-release-ci/SKILL.md#releases) (pushing a `<version>` tag builds and publishes each platform whose version equals it); main-branch pushes and manual triggers only build and verify.
- When modifying CI workflows, account for in-progress branches not yet rebased; new requirements must degrade gracefully rather than fail all in-progress PRs.

- When receiving untrusted JSON Schema, limit size and nesting depth before compilation, assess resource consumption from regular expressions, format validation, and input size, and explicitly reject anything outside the supported scope.
- Do not permit CSP `unsafe-eval` to run Ajv in the renderer; fixed schemas can be precompiled at build time, while external dynamic schemas are handled by a controlled host.
- Passing data validation does not establish identity, permissions, or execution authorization.
