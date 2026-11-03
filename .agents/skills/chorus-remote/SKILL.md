---
name: chorus-remote
description: Use when changing packages/remote, packages/contracts/remote, apps/relay, or request handling reached by remote channels.
---

## Remote connectivity

Read and follow this section before changing `packages/remote/`, `packages/contracts/remote/`, or `apps/relay/`, or the request handling that remote channels reach. The place of these packages and this application in the tree, and their runtime classification, are under "Project structure" in [Project structure and architecture](../chorus-architecture/SKILL.md#project-structure-and-architecture).

### Roles and packages

- Three roles take part in a remote connection. The computer runs the execution host and accepts remote clients through `remote/access`. A client device (mobile, or another desktop) connects to a paired computer through `remote/transport`. A relay node runs `remote/relay` from a deployment entry under `apps/relay/`, helps paired devices find and reach each other, and holds neither grants nor plaintext.
- Divide the remote domain so that no package knows more than its role requires:
  - `contracts/remote`: wire types shared by clients, the host, and relay nodes: relay frames, invitations, pairing messages, node capability declarations, and link state.
  - `remote/device-identity`: device keys, signatures, fingerprints, and invitation encoding, and nothing else, so interfaces and relay nodes verify devices without loading transport code. A device identity names a paired device, not a signed-in user; user accounts belong to `identity/authentication`.
  - `remote/transport`: used on both ends. Holds the path interface, the path scheduler, end-to-end encryption, framing, and link quality, with each path kind in its own directory under `src/paths/` (such as `lan/`, `webrtc/`, and `wss-relay/`). It carries client protocol frames as opaque payloads.
  - `remote/access`: the computer side inside the execution host: invitations, device approval, grants and revocation, the local listener, registration with relay nodes, and connection acceptance.
  - `remote/relay`: the relay service logic, made of independent modules for signaling, WSS relay, and TURN credential issuance, each enabled by the deployment entry's configuration.
  - `apps/relay`: deployment entries for `remote/relay`, one directory per target under `src/`.
- Formatting of link diagnostics for display lives in `ui/i18n`, not in the remote packages.

### Connection paths

- Four path kinds coexist: LAN direct, WebRTC direct through STUN, WebRTC relayed through TURN, and WSS relay through a relay node. No path kind is exclusive or required; each deployment offers some subset, and clients use every path it offers. Do not remove a path kind to simplify another.
- The scheduler opens the available paths in parallel, starts traffic on the first one that completes authentication, keeps probing the others, moves traffic to a preferred path once it is ready, and falls back automatically when the active path fails. The default preference is LAN direct, WebRTC direct, TURN, then WSS relay; preference order, enabled path kinds, and quotas come from user settings and node capability declarations, never from constants in the scheduler.
- When traffic moves to another path, the receiver resumes the event stream from the last acknowledged event watermark, drops duplicates by event identifier, and rechecks the device grant before handling requests on the new path, so a switch neither loses nor repeats events and does not outlive a revocation.
- Every path implements the same interface: open, send and receive bytes, report metrics (latency, loss, throughput, and cost tier), and close.
- The scheduler depends only on this interface and does not branch on path kind.
- Platform primitives (WebRTC, WebSocket, LAN sockets and discovery) are injected by the composition entry as implementations of an interface declared by `remote/transport`; the libraries providing them on each platform are dependencies of the composition entry, not of `remote/transport`.

### Encryption and pairing

- Encrypt end to end above every path with a Noise session keyed by device keys from `remote/device-identity`, so relay nodes and TURN servers forward ciphertext only. WebRTC direct paths also run DTLS, which does not replace the Noise session. ICE candidates and other path negotiation travel inside the encrypted channel, so a relay node never learns more than which registered devices are talking.
- A relay node accepts a device only after verifying a signature from its device key, and routes signaling only between a computer and the devices that computer registered.
- Pairing starts from a one-time QR invitation issued by `remote/access` that carries the computer's key fingerprint, its relay node list, and an expiry. The user approves the device on the computer; `remote/access` stores the grant in the host database. Revocation closes the device's open channels and rejects its later connections.
- `remote/access` hands each authenticated channel to the same request handling that serves local `sdk/client` connections, so remote clients have no second command protocol and pass the same permission checks and approvals described in [Permissions and security](../chorus-security-design/SKILL.md#permissions-and-security).

### Relay nodes

- A computer registers with every relay node in its configuration; a client measures latency and health and picks among them, switching when one fails. Nodes share no state, so hosted and self-hosted nodes can be mixed and adding a node needs no coordination between nodes.
- Each node declares its capabilities as a list of entries, each a type plus parameters (such as signaling, WSS relay, or TURN with server addresses), with schemas in `contracts/remote`. Clients ignore entry types they do not recognize, so a node can offer a new type without breaking older clients. A hosted node may declare quotas (bandwidth or session duration), and the scheduler stays within them.

### Deployment targets

- Write `remote/relay` against Web-standard APIs only (WebSocket, `fetch`, and Web Crypto), without Node.js built-in modules outside its tests. It receives socket acceptance, registration storage, TURN credential issuance, and timed wake-ups from its deployment entry; because their implementations live in the entries rather than in another package, the package declares these interfaces itself, and `contracts/remote` holds only what clients, the host, and relay nodes share.
- `apps/relay` holds deployment entries and nothing else, one directory per target under `src/`.
- Entries do not import each other and import only `remote/relay`, `contracts/*`, `observability/logging`, and `remote/device-identity`.
- Only entries deployed to Node.js may use Node.js built-in modules; [.oxlintrc.json](../../../.oxlintrc.json) lists those entries, and a new Node.js entry is added to that list in the same change.
- Adding a target means adding a directory and its configuration, without changing `remote/relay`.
- Deployment targets:
  - `src/cloudflare/`: Cloudflare Workers with Durable Objects, deployed with Wrangler. One object per registered computer owns its WebSocket connections and registration state through the WebSocket Hibernation API, and TURN and STUN come from Cloudflare Realtime.
  - `src/node/`: a single Node.js process using `node:http` and `ws`. It issues TURN credentials for an operator-run TURN server from a shared secret and leaves TLS termination to the operator's reverse proxy.
- Values that differ per deployment (Durable Object bindings, listen address, TURN server addresses and secrets, Cloudflare Realtime credentials, quotas) are configuration of the entry, never constants in `remote/relay`.
- Run expiry and cleanup (registrations, invitations, relay sessions, TURN credentials) only from the timed wake-up primitive, never from `setInterval` or long `setTimeout` calls inside the package, because on Cloudflare a pending timer keeps the Durable Object awake and billed.
- The Cloudflare entry implements wake-ups with Durable Object alarms: one alarm per object, with pending deadlines kept in storage and the handler rescheduling the next one; alarms are delivered at least once, so handlers must be idempotent.
- The Node.js entry uses process timers.
- Do not use Cron Triggers: Durable Objects cannot be enumerated, so each object cleans up after itself.

### Adding a path or relay type

Add a new path or relay type (such as SOCKS5 relay) without changing the scheduler, encryption, `remote/access`, or the host:

1. Add the path implementation under `remote/transport/src/paths/<kind>/`, implementing the path interface.
2. Add the capability entry schema for the new type to `contracts/remote`.
3. If relay nodes must serve it, add a module to `remote/relay`, enabled by entry configuration.
4. Register the path in the composition entries and the module in the node configuration of each deployment entry that offers it.
5. Add the type's default position to the preference order in configuration.

### Testing and enforcement

- Test the scheduler against fake paths implementing the path interface, so its tests need no network.
- Test `remote/relay` in each runtime it is deployed to: on Node.js through the Vitest projects of the package and the Node.js entry, and inside the Workers runtime through the Cloudflare entry's Vitest project.
- Encode the import rules above in [.oxlintrc.json](../../../.oxlintrc.json) (who may import `remote/relay`, what the relay service and its entries import, Node.js built-in modules only in Node.js entries, and entries not importing each other), checked by `pnpm lint`. Review checks the rest of this section, including that path selection stays in configuration and that relay nodes never receive plaintext.
