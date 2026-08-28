[← Back to index](README.md)

# 03. Constants & Barrel Exports

**Files:** `server/src/constants/mongoose.options.js`, `server/src/constants/index.js`
**Layer:** Configuration (foundation layer)
**Consumed by:** `config/database.js` (`MONGOOSE_OPTIONS`), and — via the same barrel pattern — every other layer that needs a shared constant (`HTTP_STATUS`, `USER_ROLES`, `SECURITY_CONFIG`, etc.)

## Purpose

Centralizes fixed, non-secret values that multiple parts of the app need
to agree on — connection-pool sizing, HTTP status codes, user roles,
security thresholds — and exposes them all through one stable import path
via a barrel file, regardless of how many individual constants files exist
underneath it.

## Code Walkthrough

### `mongoose.options.js` — connection pool and timeout tuning

```js
const MONGOOSE_OPTIONS = Object.freeze({
    minPoolSize: 5,
    maxPoolSize: 50,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})

export { MONGOOSE_OPTIONS }
```

**Connection pooling.** Opening a MongoDB connection is a real network
handshake (TCP + wire-protocol auth) with measurable latency — too
expensive to pay on every single query. Mongoose instead keeps a **pool**
of already-open, reusable connections. `minPoolSize: 5` keeps 5
connections warm so up to 5 database operations can run concurrently
without any of them paying connection-setup cost first — necessary because
a Node server handles many HTTP requests concurrently, and a single shared
connection would serialize every database call behind whichever request
got there first. `maxPoolSize: 50` caps growth under load, so traffic
spikes can't open unbounded connections against the MongoDB server.

**Timeouts, and why they're set to very different values:**

| Option | Value | Guards against | Why this value |
|---|---|---|---|
| `serverSelectionTimeoutMS` | 5,000ms | No healthy server found to route an operation to (initial connect, or mid-operation server re-selection) | Should fail fast — the app shouldn't hang waiting to discover a server is unreachable |
| `socketTimeoutMS` | 45,000ms | An operation was sent, but the server hasn't responded on that socket in time — the driver assumes the connection is broken and closes it | Set generously because some legitimate operations (large aggregations, bulk writes) can genuinely take longer than a few seconds without anything being wrong |

The 9x difference reflects two different failure modes: "is there anyone to
talk to" should fail quickly, while "my query is still running" should be
given real room before being treated as a hang.

### `constants/index.js` — the barrel file

```js
export { MONGOOSE_OPTIONS } from "./mongoose.options.js";
export { SENSITIVE_FIELDS } from "./sensitiveFields.js";
export { HTTP_STATUS } from "./httpStatus.js";
export { SUBJECTS } from "./subjects.js";
export { SECURITY_CONFIG } from "./security.config.js";
export { USER_ROLES } from "./roles.js";
```

A **barrel file** re-exports everything from a folder's individual modules
through one entry point, so every consumer across the codebase imports
from a single stable path — `../constants/index.js` — instead of reaching
into individual files (`../constants/mongoose.options.js`,
`../constants/roles.js`, etc.) directly.

The payoff shows up under refactoring: if `roles.js` were renamed or split
into two files tomorrow, only `constants/index.js` would need to change —
one line, in one file. Every other file in the codebase that does
`import { USER_ROLES } from "../constants/index.js"` keeps working
untouched, because it never knew or cared which internal file `USER_ROLES`
actually lived in. The barrel file acts as an **encapsulation boundary**
between where a constant is *consumed* and where it is *defined*, so
internal reorganization of the `constants/` folder never ripples out to
its consumers.

## Design Decisions & Rationale

| Decision | Rationale |
|---|---|
| `Object.freeze()` on `MONGOOSE_OPTIONS` | Same immutability rationale as `config` (see [01](01-config-env-loading.md)) — connection tuning values shouldn't be mutable at runtime. |
| Separate `minPoolSize`/`maxPoolSize` rather than a single fixed pool | Balances concurrency (a warm minimum) against resource protection (a hard maximum) under variable load. |
| Asymmetric timeouts (`5000` vs `45000`) | Distinguishes "can't find a server" (fail fast) from "server is slow but working" (allow real headroom). |
| One constants folder, split into topic files, unified by a barrel `index.js` | Keeps individual files small and topic-scoped while giving every consumer one stable, refactor-proof import path. |

## Engineering Patterns Demonstrated

- Externalizing infrastructure tuning values (pool size, timeouts) instead of hardcoding them inline at the call site
- Asymmetric timeout strategy based on distinct failure modes
- Barrel-file re-exports as an encapsulation boundary against internal refactors
- Consistent `Object.freeze()` usage for any shared, non-mutable configuration object across the codebase

---
[← Back to index](README.md) · Previous: [02. Database Connection Layer](02-database-connection.md)
