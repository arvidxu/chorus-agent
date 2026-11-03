# Do not disturb the foreground

Locally run tests do not display windows on the user's screen, steal focus, or trigger system interfaces requiring user action. The following outcomes must be guaranteed by test configuration, without relying on runner actions.

- Test-launched Electron applications do not activate themselves, acquire keyboard focus, or display windows on the user's current screen: logic-only cases use hidden windows, without Dock icons or menu-bar switching on macOS.
- Cases verifying window visibility run only on virtual displays or CI; without a local virtual display, leave them to CI and report them as locally unverified. All Linux cases run on virtual displays.
- Verify in-app focus-dependent behavior through in-app focus simulation, without relying on operating-system focus or system-level keyboard delivery; trigger native menus and global shortcuts through main-process entry points.

- Tests do not trigger system interfaces requiring user action: do not read or write the user's login keychain, access real microphones, cameras, or screens, send system notifications, bounce Dock icons, or open external browsers or file managers. Test processes leave no "unexpectedly quit" crash dialogs after exit. Substitutes record calls at these boundaries for assertions; verification requiring real devices or system permissions uses separate entry points in `scripts/verify/`.

- Browser-layer tests run headlessly in every environment, without automatically opening reports, UIs, or debug windows on failure; headed mode, `--ui`, and debugging modes require user requests. Configure headless operation and disabled report opening explicitly rather than relying on `CI` environment-variable defaults. When connecting to applications or browsers the user is using, do not change focus; handle media preferences such as color schemes under ["Test organization"](test-organization.md).

- E2E servers are either started by this run's fixtures or explicitly specified by command, never reused from other worktrees, agents, or developers merely because ports match. Fixture-started servers use system-allocated ports or ports specified by arguments; if an argument-specified port is occupied, fail immediately rather than connecting to the old service.

- For local mobile E2E, launch simulators without windows and explicitly specify devices in commands; do not open or activate Simulator (DeviceHub) or Android emulator windows during tests, or start windowed devices automatically when no device is found. Debugging to watch interfaces requires user requests. See [Mobile app (apps/mobile)](../../chorus-mobile/SKILL.md#mobile-app-appsmobile) for specific commands.

- Leave desktop and mobile E2E to CI by default.
- For changes involving main process, preload, IPC, windows, tray, system permissions, packaged artifacts, or mobile native capabilities and navigation, run only the single case file covering the change locally, meeting all other requirements in this section.
- Otherwise do not run these suites locally, and state "left to CI, not verified locally" in the result when a CI job covers them, or "not verified" otherwise.
- Full GUI suites run locally only when requested by the user.
