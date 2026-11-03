---
name: chorus-desktop
description: "Use when changing apps/desktop: main process, preload, IPC, windows, packaging, or Electron security settings."
---

## Desktop app (apps/desktop)

This section applies to `apps/desktop/`. When changing renderer UI, also read [UI development](../chorus-ui/SKILL.md#ui-development). When changing user-visible text (including main-process native menus and dialogs), read [Internationalization](../chorus-i18n/SKILL.md#internationalization).

### Electron and native capabilities

- The renderer accesses the main process through restricted interfaces exposed by preload.
- Assemble IPC handlers centrally in the main process; do not expose the full Electron or IPC API to the renderer.
- Keep `nodeIntegration: false`, `contextIsolation: true`, and `sandbox: true`.
- Validate the sender of every IPC message and validate payloads against schemas in the main process.
- Requests sent by the renderer through preload to the execution host must also be schema-validated by the host, not only by the main process.
- Bundle preload as a single CommonJS file; do not use ESM.

- Configure a content security policy (CSP) for the renderer.
- Allow only the application itself and explicitly needed sources in `img-src`, `connect-src`, and similar directives; do not disable `webSecurity`.
- Grant only necessary permissions through `session.setPermissionRequestHandler`, and also set `setPermissionCheckHandler` and `setDevicePermissionHandler`, denying by default.
- Allow only expected URLs for navigation and new windows; do not pass untrusted content directly to `shell.openExternal`.
- Navigation restrictions apply to the application UI; isolate views used for browser control as required by [Permissions and security](../chorus-security-design/SKILL.md#permissions-and-security).

- Disable `webviewTag`, and in production load pages through a custom protocol registered as privileged, not `file://`; the protocol handler must reject paths that resolve outside the application resource directory. The application uses a single-instance lock.

- When packaging, use Electron Fuses to disable `RunAsNode`, `EnableNodeOptionsEnvironmentVariable`, `EnableNodeCliInspectArguments`, and `GrantFileProtocolExtraPrivileges`, and enable `EnableCookieEncryption`, `EnableEmbeddedAsarIntegrityValidation`, and `OnlyLoadAppFromAsar`.
- End-to-end tests use a test build without Fuses set (Playwright's Electron driver depends on inspect arguments).
- Perform a separate smoke check on release artifacts, read the Fuse states, and confirm normal startup; run the smoke check in CI or on a virtual display.
- The release workflow runs it with [scripts/release/desktop.mjs](../../../scripts/release/desktop.mjs); it starts every macOS app and the Windows app for the runner's architecture, and checks only the Fuses of Linux apps and other Windows architectures.

- Vite bundles the main process and renderer, and electron-builder copies every package in `dependencies` into the installer.
- Declare bundled packages in `devDependencies`; `dependencies` holds only packages the packaged main process loads at runtime without bundling (such as native modules), and each of them must also be excluded from the main-process bundle in [apps/desktop/vite.main.config.ts](../../../apps/desktop/vite.main.config.ts).
- Move packages that generators such as the shadcn CLI add to `dependencies` into `devDependencies`.
- Review verifies this.

- For the dedicated channel the main process provides to the execution host, host startup scripts, and rules for running third-party code, see the runtime-location classifications under "Project structure" in [Project structure and architecture](../chorus-architecture/SKILL.md#project-structure-and-architecture) and [Permissions and security](../chorus-security-design/SKILL.md#permissions-and-security).

- The main process starts the execution host in a separate process through `utilityProcess` and owns its startup, readiness wait, exit, and failure cleanup. See "Key architecture patterns" in [Project structure and architecture](../chorus-architecture/SKILL.md#project-structure-and-architecture) for the main process's responsibility boundaries.

- Tests and agent-launched apps do not reveal windows or steal focus. The unpackaged app keeps its windows hidden and stays out of the Dock when started with `CHORUS_HIDE_WINDOWS=1`; a packaged app ignores the variable. Test builds create windows hidden or without activation, as required by "Do not disturb the foreground" in [Testing and verification](../chorus-testing/SKILL.md#testing-and-verification).

- The `desktop-main` project runs on Node. Unit tests replace `electron`, and libraries that load it themselves (such as `electron-updater`), only at that boundary and state why beside the mock; passing them does not prove real Electron behavior. Put behavior requiring real Electron in E2E tests.
