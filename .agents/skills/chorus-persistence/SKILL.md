---
name: chorus-persistence
description: Use when changing persisted data, database access, migrations, transactions, or data shared by several hosts.
---

## Persistence

- Use `node:sqlite` with handwritten SQL for persistence and open databases only in the execution host process; keep database connections, statements, and row types in the persistence layer, and let business logic access them through storage interfaces.
- `node:sqlite` offers only synchronous interfaces: keep transactions short, do not await network or model calls inside them, and retry database contention asynchronously rather than blocking the event loop for long periods.
- Write table-structure changes as sequentially numbered migration files executed according to `PRAGMA user_version`; a failed or interrupted migration must leave no partially applied structural or data changes, and the database stays at the version before that migration.
- Complete migrations before the host accepts requests, prevent simultaneous migrations by multiple hosts, and retain a recoverable backup before migration (without directly copying an in-use database file); preserve the backup and report explicit errors on failure.
- Do not modify, rewrite, or renumber released migrations; validate new migrations for upgrading existing data and recovering from failure.
- Desktop and CLI host versions may differ: no read or write may interpret newer data with an older structure; stop reading and writing when the database version exceeds the current program's supported range and tell the user to upgrade.
- Business code does not depend on internal migration-execution state.
- Do not create duplicate read paths when a one-time migration can handle configuration; when released data or established upgrade flows require compatible reads, maintain them under the corresponding contract.
- Do not recommend deleting databases to solve problems; use read-only connections for investigation and established commands for writes.

- Desktop and multiple CLI execution hosts may simultaneously use the same data directory.
- A session, scheduled task, or background job has only one executor at a time, determined by a database lease; a host that loses its lease detects this and immediately stops before its next write or side effect, so two hosts cannot execute simultaneously.
- After a session's executor exits or becomes unreachable, other hosts do not automatically resume it: mark the session interrupted and in-progress tool calls and background jobs it started as having unknown results, awaiting user handling.
- Background jobs started within a session run on the host executing that session; only the desktop host executes scheduled tasks and background jobs belonging to no session, while CLI hosts execute only sessions they initiated and those sessions' background jobs.
- Hosts do not connect directly to one another; they detect each other's modifications through database or file changes.

- Transactions wrap only writes that must succeed or fail together, not entire handler functions; put irreversible side effects such as sending messages or calling external APIs after transaction commit. Repositories handle only data access; business rules belong in the business layer. Pass large data such as model context, file content, and images across process boundaries (IPC, task queues) by reference (file paths, storage IDs), not directly in messages.
