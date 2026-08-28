[← Back to index](README.md)

# 01. Environment Configuration Loading

**File:** `server/src/config/index.js`
**Layer:** Configuration (foundation layer)
**Depends on:** `dotenv`, `.env`
**Consumed by:** `config/database.js`, `server.js`, and any module that needs a runtime setting (JWT secrets, cookie names, mail settings, etc.)

## Purpose

Every runtime setting the application needs — database URI, JWT secrets,
mail credentials, cookie names, timing values — originates as a plain-text
string in `.env`. This module is the single place that reads those raw
strings, validates the ones the app cannot run without, applies safe
fallbacks and type coercion to the rest, and freezes the result into one
immutable `config` object that the rest of the codebase imports instead of
touching `process.env` directly.

## Code Walkthrough

### Loading `.env` into `process.env`

```js
import dotenv from "dotenv";
dotenv.config();
```

`dotenv` is a third-party npm package (`package.json → dependencies`,
installed via `npm install dotenv`), not a Node built-in. `process.env`
itself *is* a Node built-in — a global object holding the OS-level
environment variables the process started with, and it exists whether or
not `dotenv` is used. What `dotenv.config()` does is read the `.env` file
in the project root and **mutate `process.env` in place**, adding one
property per `KEY=value` line. Everything downstream — `MONGO_URI`,
`JWT_ACCESS_SECRET`, and so on — is only available on `process.env`
because this line ran first.

### Pulling the raw values off `process.env`

```js
const {
    PORT, NODE_ENV, MONGO_URI, SERVICE, LOG_DIRECTORY,
    JWT_ACCESS_SECRET, JWT_ACCESS_EXPIRY_SECONDS, JWT_REFRESH_EXPIRY_DAYS,
    MAIL_HOST, MAIL_PORT, MAIL_SECURE, MAIL_USER, MAIL_PASS, MAIL_FROM,
    PASSWORD_RESET_TOKEN_EXPIRY_MINUTES,
    ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE,
} = process.env;
```

A single destructuring assignment pulls every expected key into a local
`const`, so the rest of the file can refer to `MONGO_URI` instead of
`process.env.MONGO_URI` repeatedly. Every one of these values is a
**string** (or `undefined` if absent) — `process.env` never holds numbers
or booleans, which is why the coercion logic further down exists.

### Fail-fast validation of critical secrets

```js
const requiredEnvs = {
    MONGO_URI,
    JWT_ACCESS_SECRET,
}

for (const [key, value] of Object.entries(requiredEnvs)) {
    if (!value || value.trim() === "" || typeof value !== "string") {
        throw new Error(`Missing .env value: ${key}`);
    }
}
```

Out of ~17 configurable values, only two are treated as non-negotiable:
`MONGO_URI` (without it, the app has no database to persist to) and
`JWT_ACCESS_SECRET` (without it, no token can be signed or verified, so
authentication cannot function at all). `Object.entries(requiredEnvs)`
converts `{ MONGO_URI: "...", JWT_ACCESS_SECRET: "..." }` into an array of
`[key, value]` pairs, which the loop array-destructures on each iteration.
If either is missing, the module throws immediately at import time — the
process never reaches `app.listen()`. This is a deliberate **fail-fast**
design: a missing critical secret should crash the app loudly at startup,
not surface later as a confusing runtime error mid-request.

### Safe numeric coercion with fallbacks

```js
const toNumber = (value, fallback) => {
    if (!value || value.trim() === "") {
        return fallback;
    }

    const validNumber = Number(value);

    return Number.isFinite(validNumber) &&
        validNumber > 0 &&
        validNumber < 65535 ?
        validNumber :
        fallback;
}
```

Every non-critical numeric setting (`PORT`, JWT expiries, mail port, etc.)
goes through this helper instead of a bare `Number(value)`. It returns the
`fallback` — rather than throwing — for three distinct failure modes: an
empty/missing value, a non-numeric string (`Number("abc")` is `NaN`, which
fails `Number.isFinite`), or a value outside the valid range. The range
check `> 0 && < 65535` is specific to port numbers: `65535` (`2^16 - 1`) is
the maximum value a 16-bit TCP/UDP port can hold, so an out-of-range
`PORT` value degrades gracefully to the default rather than producing an
invalid configuration.

### Case-insensitive environment normalization

```js
const allowedNodeEnvs = ["development", "test", "production"];
let resolvedNodeEnvs;

let normalizedNodeEnv = String(NODE_ENV ?? "").trim().toLowerCase();

if (!normalizedNodeEnv) {
    resolvedNodeEnvs = "development";
} else if (!allowedNodeEnvs.includes(normalizedNodeEnv)) {
    throw new Error(`NODE_ENV must include ${allowedNodeEnvs.join(", ")}`)
} else {
    resolvedNodeEnvs = normalizedNodeEnv;
}
```

`String(NODE_ENV ?? "")` coerces `undefined`/`null` to an empty string
safely (avoiding a crash on `.trim()` of `undefined`), and
`.toLowerCase()` normalizes case before comparing against the allow-list —
so `NODE_ENV=Production` resolves correctly to `"production"` instead of
incorrectly throwing on a case mismatch. Missing `NODE_ENV` defaults to
`"development"`; any value outside the allow-list throws, rather than
silently accepting an unrecognized environment name.

### Building the immutable config object

```js
const config = Object.freeze({
    port: toNumber(PORT, 6000),
    nodeEnv: resolvedNodeEnvs,
    mongoUri: MONGO_URI,
    ...
    mailSecure: MAIL_SECURE === "true",
    mailFrom: MAIL_FROM || MAIL_USER,
    ...
})

export { config }
```

`Object.freeze()` makes `config` immutable after creation. Since this
project runs as ESM (`"type": "module"`, which is strict-mode by default),
any later attempt to write `config.port = 4000` from another file throws a
`TypeError` rather than silently succeeding — preventing one part of the
app from mutating shared configuration that every other part depends on.

`mailSecure: MAIL_SECURE === "true"` is a deliberate string comparison,
not `Boolean(MAIL_SECURE)`. Every value from `process.env` is a string, so
`Boolean("false")` would incorrectly evaluate to `true` (any non-empty
string is truthy). Comparing against the literal string `"true"` is the
correct way to derive real boolean semantics from an environment variable.

## Design Decisions & Rationale

| Decision | Rationale |
|---|---|
| Fail fast on missing `MONGO_URI` / `JWT_ACCESS_SECRET` | These two failures make the app fundamentally non-functional; better to crash at startup with a clear message than fail unpredictably mid-request. |
| Silent fallback for all other values | Non-critical settings (ports, expiries, mail config) shouldn't take the whole app down — they degrade to sane defaults instead. |
| `Object.freeze()` on the final config object | Prevents accidental or malicious mutation of shared configuration from anywhere else in the codebase. |
| Case-insensitive `NODE_ENV` normalization | Environment variables are set by humans and deploy tooling; case typos shouldn't cause a hard crash. |
| String comparison for booleans (`=== "true"`) | `process.env` values are always strings — naive `Boolean()` coercion on a string is a common source of bugs. |

## Engineering Patterns Demonstrated

- Fail-fast startup validation for critical dependencies
- Defensive parsing / type coercion with explicit fallback values
- Immutable shared configuration (`Object.freeze`)
- Centralizing environment access behind a single module (no `process.env` reads elsewhere in the codebase)
- Case-insensitive input normalization for human-provided configuration

---
[← Back to index](README.md) · Next: [02. Database Connection Layer](02-database-connection.md)
