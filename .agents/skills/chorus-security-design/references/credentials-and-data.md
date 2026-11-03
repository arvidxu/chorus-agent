# Channels, credentials, encryption, and data

- The local channel through which `sdk/client` connects to the execution host allows connections only from a party holding the token for this launch: prefer a pipe or `MessagePort` inherited at launch; when an addressable endpoint is needed, prefer channels whose access permissions can be restricted by the platform, and always validate the token.
- With TCP, bind only to loopback and validate `Host` and `Origin` to prevent DNS rebinding.
- Other users' processes, local processes without the token, and web pages cannot connect to the host.
- Remote pairing invitations expire and can be used only once; phone-to-computer connections use end-to-end encryption, with the relay forwarding ciphertext only.
- Validate each request against current device authorization and project scope, with immediate revocation and replay protection on messages; approvals from phones undergo the same authorization checks as local approvals.

- Host-side configuration stores only credential references; credential access, encryption, and decryption all use interfaces provided by `packages/platform/secrets`.
- Mobile uses system secure storage as specified in [Mobile app (apps/mobile)](../../chorus-mobile/SKILL.md#mobile-app-appsmobile).
- Store credentials in system secure storage such as the system keychain, accessible for reading and writing by both desktop and CLI hosts, without relying on main-process-only interfaces.
- Reading the same credential from both hosts must not repeatedly prompt for system authorization; test this on each platform during integration.
- If system secure storage is unavailable or provides only weak protection (such as Linux without a keyring), clearly inform the user, use credentials only in current-process memory by default, and save with weak protection only after the user's explicit choice.
- Encrypted user data must remain accessible and recoverable after upgrades; do not treat it as disposable development data or require users to delete or recreate it.
- After rotating or disabling a key, do not encrypt new data with the old key; do not delete an old key while retained data still requires it for decryption.
- Key rotation, data migration, and destruction must preserve recoverability of data that must remain.
- Changes to envelope formats, additional authenticated data (AAD) semantics, or key derivation require explicit format versions and a compatibility plan.
- Migrations authenticate source data first and retain recovery material, remaining recoverable after failure or interruption; do not regenerate salts or discard keys to bypass incompatibility.
- On unknown formats, data corruption, or authentication failure in encrypted data, preserve the original data and return an error (delete normally when the user explicitly requests deletion); do not bypass authentication or fall back to plaintext.
- Rebuild derived indexes only after source ciphertext authentication succeeds.

- Queries select only needed fields; sensitive fields such as credential keys do not appear in responses or query results.
- Data isolated by workspace, configuration profile, or user carries ownership fields, and cross-scope access is denied by default; declaring a class of data exempt from isolation is a decision requiring review.
- Process-level caches and object pools shared across users or conversations do not store user-, request-, or credential-specific data; clear previous state before reusing objects.
- After a user deletes conversations, memories, or artifacts, deleted content cannot be recovered from application data (except pre-upgrade database backups, addressed later in this item) or reenter model context: delete derived indexes, caches, projections, compressed summaries covering that content, long-term memories extracted from it, and application-saved export copies as well; leave no recoverable remnants in database or log files, and report when cleanup cannot be confirmed.
- If the user wants to retain certain derived memories, display each one and obtain confirmation before deletion.
- Export files the user saved elsewhere are not automatically deleted; pre-upgrade database backups may still contain deleted content, so specify their retention period in settings or documentation and remove them on expiry.
- Only the current user may access the application's data directory and its databases, backups, configuration, caches, logs, lock files, and export copies.
- Obtain user consent before uploading dictation audio for cloud recognition; do not log audio or retain it after recognition unless the user enables saving.

- When the product writes configuration for other programs on the user's system (such as shell configuration files or editor or other tool settings), make incremental, idempotent changes and back up first; installation does not also install or upgrade unrelated software.
- Show planned changes and obtain confirmation before such writes, and provide an uninstall or rollback method.
- Explain the reasons for new Electron or operating-system permissions (microphone, screen recording, accessibility, and so on).
