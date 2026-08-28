[← Back to index](README.md)

# 02. Database Connection Layer

**File:** `server/src/config/database.js`
**Layer:** Configuration (foundation layer)
**Depends on:** `mongoose`, `constants/index.js` (`MONGOOSE_OPTIONS`), `config/index.js` (`config`), `logger/pino.logger.js` (`systemLogger`)
**Consumed by:** `server.js`

## Purpose

Isolates all MongoDB connection logic — opening the connection, applying
pool/timeout options, and logging connection-lifecycle events — behind one
function, `connectDatabase`, so `server.js` doesn't need to know anything
about Mongoose directly.

## Code Walkthrough

### Imports

```js
import mongoose from "mongoose";
import { MONGOOSE_OPTIONS } from "../constants/index.js";
import { config } from "../config/index.js";
import { systemLogger } from "../logger/pino.logger.js";
```

`mongoose` is imported as a **default import** because the package ships a
default export. Verified directly against the installed package:

```
node -e "import('mongoose').then(m => console.log(Object.keys(m)))"
```

Mongoose also exposes named exports (`connect`, `model`, `Schema`, among
others) — so `import { connect } from "mongoose"` is valid — but
`connection` is **not** one of them; it exists only as a property on the
default-exported object (`mongoose.connection`). That's why this file
consistently calls `mongoose.connect(...)` and `mongoose.connection.on(...)`
off the single default import rather than mixing in named imports.

`{ config }` uses named-import braces because `config/index.js` exports it
with `export { config }` (a named export). For a bare `import config from
"..."` to work, `config/index.js` would instead need `export default
config`.

### Opening the connection

```js
const connectDatabase = async () => {
    try {
        await mongoose.connect(config.mongoUri, MONGOOSE_OPTIONS);
    } catch (error) {
        systemLogger.error({ err: error }, "Database connection error");
        throw error;
    }
}
```

The `catch` block both logs the error **and** re-throws it. This is a
deliberate two-step error-handling pattern used throughout the codebase:
log at the point of failure (for observability — the log has full context
about *where* it happened), then propagate the error up so the caller
decides how the *application* should respond.

Tracing the caller confirms why the re-throw matters. In `server.js`:

```js
const startServer = async () => {
    try {
        await connectDatabase();
        const server = app.listen(config.port, () => {
            systemLogger.info(`Server listening on port: ${config.port}`);
        })
        gracefulShutdown(server);
    } catch (error) {
        systemLogger.error({ err: error }, "Server connection error");
        process.exit(1);
    }
}
```

`startServer` awaits `connectDatabase()` **before** calling `app.listen`.
Because `connectDatabase` re-throws, a failed connection makes that
`await` throw too, which is caught by `startServer`'s own `catch` — logging
a second, distinct message and calling `process.exit(1)`. `app.listen`
never executes, so the "Server listening on port" message never appears
when the database is unreachable.

Had `database.js` swallowed the error instead (logged it, no re-throw),
`connectDatabase()` would have resolved normally, `startServer` would have
proceeded straight to `app.listen`, and the process would report itself as
running — accepting HTTP requests — with no working database connection,
failing unpredictably on the first query that touches Mongoose instead of
failing loudly and immediately at startup.

### Connection-lifecycle listeners

```js
mongoose.connection.on("connected", () => {
    systemLogger.info("Database has been connected");
})

mongoose.connection.on("disconnected", () => {
    systemLogger.warn("Database has been disconnected");
})

mongoose.connection.on("error", (error) => {
    systemLogger.error({ err: error }, "Database connection error")
})
```

These are registered once, at module-import time, but each listener stays
active for the **entire lifetime of the process** — not just the initial
connection attempt. This is the key distinction from the `try/catch` in
`connectDatabase`, which can only ever report a failure of the *first*
connection call:

| | Fires on initial connect failure | Fires on later runtime disconnects |
|---|---|---|
| `connectDatabase`'s `try/catch` | Yes | No — the promise already resolved |
| `mongoose.connection.on("error"/"disconnected")` | Yes | Yes — stays registered for the app's lifetime |

A single failed initial connection can therefore be logged from **both**
paths: Mongoose's connection object emits an internal `"error"` event
(caught by the listener) while the same failure also rejects the
`connect()` promise (caught by the `try/catch`, then re-thrown and logged
a third time by `server.js`). This overlap is expected and not a bug — the
listener exists specifically to catch failures the one-time `try/catch`
cannot, i.e. connection drops that happen well after a successful startup.

## Design Decisions & Rationale

| Decision | Rationale |
|---|---|
| Log-then-rethrow in `connectDatabase` | Preserves full error context at the point of failure while still letting the top-level caller (`server.js`) control how the process responds. |
| Await `connectDatabase()` before `app.listen()` | Guarantees the server never starts accepting requests without a working database connection. |
| Persistent `mongoose.connection` event listeners | Covers connection failures that happen *after* a successful startup — something a one-time `try/catch` around `connect()` cannot detect. |
| Connection pool/timeout values centralized in `MONGOOSE_OPTIONS` | Keeps tunable infrastructure values (pool size, timeouts) out of the connection logic itself — see [03. Constants & Barrel Exports](03-constants-and-barrel-exports.md). |

## Engineering Patterns Demonstrated

- Fail-fast startup sequencing (`await` the database before starting the HTTP server)
- Log-then-rethrow error propagation across module boundaries
- Long-lived event listeners for runtime connection-state monitoring, distinct from one-time startup validation
- Verifying assumptions about a third-party package's export shape empirically, rather than guessing

---
[← Back to index](README.md) · Previous: [01. Environment Configuration Loading](01-config-env-loading.md) · Next: [03. Constants & Barrel Exports](03-constants-and-barrel-exports.md)
