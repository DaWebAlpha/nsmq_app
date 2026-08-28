[← Back to index](README.md)

# 03. Shared Constants & Barrel Exports

**Files:** `server/src/constants/mongoose.options.js`, `httpStatus.js`, `subjects.js`, `roles.js`, `security.config.js`, `sensitiveFields.js`, `index.js`
**Layer:** Configuration (foundation layer)
**Consumed by:** every layer of the app — `config/database.js` (`MONGOOSE_OPTIONS`), `errors/` (`HTTP_STATUS`), `models/notes/note.model.js` (`SUBJECTS`), `models/auth/userSecurity.model.js` (`SECURITY_CONFIG`), `logger/pino.logger.js` (`SENSITIVE_FIELDS`), and role-checking middleware/controllers (`USER_ROLES`)

## Purpose

Centralizes every fixed, non-secret value that multiple parts of the app
need to agree on — connection-pool sizing, HTTP status codes, valid note
subjects, user roles, account-lockout thresholds, and log-redaction
patterns — and exposes them all through one stable import path via a
barrel file, regardless of how many individual constants files exist
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

### `httpStatus.js` — named HTTP status codes

```js
const HTTP_STATUS = Object.freeze({
    CONTINUE: 100, OK: 200, CREATED: 201, ACCEPTED: 202,
    URL_MOVED_PERMANENTLY: 301, URL_CHANGED_TEMPORARILY: 302,
    BAD_REQUEST: 400, UNAUTHENTICATED: 401, FORBIDDEN: 403, NOT_FOUND: 404,
    CONFLICT: 409, TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500, BAD_GATEWAY: 502, SERVICE_UNAVAILABLE: 503,
})

export { HTTP_STATUS }
```

Named constants over raw numbers for two reasons: readability
(`HTTP_STATUS.NOT_FOUND` is self-documenting where `404` is not) and a
single shared source of truth for every error class and response helper in
the app. Deliberately only 15 codes rather than the full official list of
~60 — a **YAGNI** choice: these are exactly the codes this app's error
classes actually use (`BAD_REQUEST`, `UNAUTHENTICATED`, `FORBIDDEN`,
`NOT_FOUND`, `CONFLICT`, `TOO_MANY_REQUESTS`, `INTERNAL_SERVER_ERROR` map
one-to-one to the classes in `errors/`), plus a handful of success/redirect
codes. Adding a new one later is a single-line change.

### `subjects.js` — the valid note-subject whitelist

```js
const SUBJECTS = Object.freeze(["physics", "mathematics", "chemistry", "biology"])

export { SUBJECTS }
```

Note this freezes an **array**, not an object — `Object.freeze` works
identically on both, so `SUBJECTS.push("geography")` fails silently
(non-strict) or throws `TypeError` (strict/ESM, which this project is).
This array is passed as the `enum` on the `Note` model's `subject` field.
Mongoose treats `enum` as a **whitelist validator**: saving a `Note` with
any value not exactly matching one of these four strings — a typo like
`"Physics"` or an invalid value like `"geography"` — is rejected with a
`ValidationError` before it ever reaches MongoDB. Because both the model
and any controller/service validation reference this same constant,
there's no risk of the model's allowed values and a validator elsewhere in
the app silently drifting apart.

### `roles.js` — role name constants

```js
const USER_ROLES = Object.freeze({
    "USER": "user",
    "ADMIN": "admin",
    "SUPERADMIN": "superadmin"
})

export { USER_ROLES };
```

> **Correction made during this review:** the original comment on this
> file claimed a typo like `USER_ROLES.ADMINN` would throw a
> `ReferenceError`. That's incorrect — plain JavaScript object property
> access never throws on a missing key; it silently evaluates to
> `undefined`. A comparison like `role === USER_ROLES.ADMINN` would
> silently always be `false`, which is exactly the "silent mismatch" the
> original comment claimed this pattern prevented. What this constant
> actually protects against is a typo in the **string value** (e.g.
> `"admni"`) by centralizing it in one place with editor autocomplete —
> not a typo in the property name itself. The comment has been corrected
> to describe this accurately.

### `security.config.js` — account-lockout thresholds

```js
const SECURITY_CONFIG = Object.freeze({
    MAX_FAILED_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION_MINUTES: 15,
});

export { SECURITY_CONFIG };
```

Defends against **brute-force** and **credential-stuffing** attacks —
capping guesses at 5 makes automated password guessing impractical. The
lockout is deliberately **temporary** (15 minutes, self-expiring) rather
than permanent pending admin unlock, for two reasons: a genuine user who
mistyped their password gets a natural second chance without needing
support intervention, and a permanent lockout would itself become an
attack vector — anyone could deliberately fail-login *someone else's*
account 5 times purely to lock them out, turning the defense into a
denial-of-service tool against legitimate users.

### `sensitiveFields.js` — log-redaction field patterns

```js
const SENSITIVE_FIELDS = Object.freeze([
    "password", "*.password", "secret", "*.secret",
    "token", "*.token", "accessToken", "refreshToken",
    "cookie", "session", "authorization", "headers.authorization",
    "cardNumber", "cvv", "ssn", "socialSecurityNumber",
    "__v",
]);

export { SENSITIVE_FIELDS };
```

Consumed by `logger/pino.logger.js`'s `redact` config (see
[04-pino-logger.md](04-pino-logger.md)) to strip credentials, tokens,
cookies, and PII from every log line before it's written anywhere.

The wildcard syntax matters precisely: `"*.password"` matches `password`
nested exactly **one path segment deep** (e.g. `user.password`) — it is
**not** unlimited-depth. A password nested two levels down
(`a.b.password`) would not be caught by this pattern and would need a
separate `"*.*.password"` entry. This is a real, worth-knowing limitation
of the current list, not just a detail.

> **Bug found and fixed during this review:** the list originally included
> `"_id"` under a "Database Internal Cruft" section alongside `"__v"`.
> Since `redact` with `remove: true` **deletes** the field entirely (not
> just visually hides it), redacting `_id` stripped the one field needed
> to trace a log line back to its exact database document — actively
> harmful for debugging, and `_id` was never sensitive in the first place
> (it's an identifier, not a secret). `__v` (Mongoose's internal version
> key) is genuinely just noise and correctly remains. `_id` has been
> removed from the list.

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
into individual files directly.

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
| `Object.freeze()` on every constant, object or array | Consistent immutability guarantee across the whole shared-config surface, not just some of it. |
| Asymmetric Mongo timeouts (`5000` vs `45000`) | Distinguishes "can't find a server" (fail fast) from "server is slow but working" (allow real headroom). |
| `HTTP_STATUS` limited to codes actually in use | YAGNI — avoids a bloated list of unused codes; trivial to extend when a real need arises. |
| `SUBJECTS` shared between model `enum` and any other validation | Single source of truth — model and validators can never silently drift apart on what counts as valid. |
| Temporary (not permanent) account lockout | Balances brute-force defense against both user self-recovery and the risk of the lockout itself being weaponized as a DoS. |
| One constants folder, split into topic files, unified by a barrel `index.js` | Keeps individual files small and topic-scoped while giving every consumer one stable, refactor-proof import path. |

## Engineering Patterns Demonstrated

- Externalizing infrastructure tuning values (pool size, timeouts) instead of hardcoding them inline at the call site
- Asymmetric timeout strategy based on distinct failure modes
- Shared whitelist constants as a single source of truth across model validation and business logic
- Barrel-file re-exports as an encapsulation boundary against internal refactors
- Recognizing when a defensive security mechanism (account lockout) can itself become an attack surface, and designing around it
- Verifying code comments against actual language semantics rather than trusting them at face value

## Corrections Made During This Review

- `roles.js`: comment claiming a typo produces a `ReferenceError` was factually incorrect (JS returns `undefined` on missing object properties) — corrected to describe the real guarantee (string-value centralization, not property-access safety).
- `sensitiveFields.js`: `"_id"` was incorrectly listed for redaction, silently deleting the one field needed to trace a log line to its source document — removed; `"__v"` correctly remains as genuine noise.

---
[← Back to index](README.md) · Previous: [02. Database Connection Layer](02-database-connection.md) · Next: [04. Structured Logging with Pino](04-pino-logger.md)
