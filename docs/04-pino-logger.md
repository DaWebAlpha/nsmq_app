[← Back to index](README.md)

# 04. Structured Logging with Pino

**File:** `server/src/logger/pino.logger.js`
**Layer:** Foundation (cross-cutting concern used by every other layer)
**Depends on:** `pino`, `pino-roll`, `pino-pretty` (dev only), `node:fs`, `node:path`, `config/index.js`, `constants/index.js` (`SENSITIVE_FIELDS`)
**Consumed by:** every layer of the app — `config/database.js`, `server.js`, middlewares, services, etc.

## Purpose

Provides three purpose-scoped, structured JSON loggers — `systemLogger`,
`auditLogger`, and `accessLogger` — that write to daily-rotated log files
on disk, with automatic redaction of sensitive fields, and (in development
only) pretty-printed, colorized console output.

## Code Walkthrough

### Environment-driven setup

```js
const isDevelopment = config.nodeEnv === "development";
const logLevel = isDevelopment ? "debug" : "info";

const logDirectory = path.resolve(config.logDirectory);

if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
}
```

`node:fs` and `node:path` use the explicit `node:` prefix, which forces
resolution to Node's built-in modules rather than any same-named package
that might exist in `node_modules` — an unambiguous, defensive style for
core imports. `{ recursive: true }` on `mkdirSync` matters because the
default behavior only creates the final path segment; without it, creating
a nested path like `logs/system` would throw `ENOENT` if `logs/` didn't
already exist. `recursive: true` also makes the call idempotent — safe to
run on every app startup, not just the first.

### `buildTargetTransport` — a target-config factory

```js
const buildTargetTransport = (fileLocation, frequency, fileSize, minLevel = logLevel, retentionCount) => ({
    target: "pino-roll",
    level: minLevel,
    options: {
        file: path.join(logDirectory, fileLocation),
        extension: ".json",
        frequency,
        size: fileSize,
        mkdir: true,
        dateFormat: "yyyy-MM-dd",
        limit: { count: retentionCount },
        sync: false,
    }
})
```

The parentheses around the returned object — `=> ({ ... })` — are required
syntax, not style: an arrow function body that starts with `{` is always
parsed as a block of statements, never an object literal, even when an
object was intended. Wrapping in `( )` forces JS to treat it as an
expression.

`sync: false` means log writes are non-blocking — `logger.error(...)`
returns immediately, and the actual disk write is queued and handled by a
worker thread. This trades a small durability risk (a queued write can be
lost if the process crashes before it flushes) for real performance —
logging never blocks request handling under normal operation.

### Dev-only pretty console output

```js
const terminalTargets = isDevelopment
    ? [{ target: "pino-pretty", options: { colorize: true, ignore: "pid,hostname", translateTime: "SYS:yyyy-MM-dd HH:mm:ss" } }]
    : [];
```

Gated on `isDevelopment` for two concrete reasons, not just preference:
`pino-pretty` does real per-line parsing/formatting work, wasteful at
production log volume; and production processes typically run headless
(Docker/PM2/systemd) with no terminal attached to benefit from
colorization. There's also a hard technical reason this gate must never be
removed: `pino-pretty` is a `devDependency`. A production install
(`npm ci --omit=dev`) never places it in `node_modules` — if this target
were ever loaded in production, pino would fail to load the transport
module in its worker thread, crashing the app at startup.

### Three transport pipelines

```js
const systemTransport = pino.transport({
    targets: [
        buildTargetTransport("system/app-info", "daily", "20m", "info", 180),
        buildTargetTransport("system/app-error", "daily", "20m", "error", 180),
        ...terminalTargets,
    ]
});
// accessTarget and auditTransport follow the same shape, one target each
```

Pino level filters are **inclusive of higher severities** (the standard
convention across logging systems): `level: "info"` means "info and
anything more severe" — so an `error`-level call satisfies both the
`app-info` target (`error >= info`) and the `app-error` target
(`error >= error`) simultaneously. `system/app-error` isn't an exclusive
partition of the log stream — it deliberately duplicates every error into
its own low-noise file, so an incident investigation doesn't require
wading through routine info-level traffic to find the handful of lines
that matter. `accessTarget` and `auditTransport` only need a single
`"info"`-level target each, since a filtered "errors only" view isn't a
meaningful use case for per-request access logs or audit trails — the
complete record is what matters there.

### `getBaseConfig` — shared logger options

```js
const getBaseConfig = () => ({
    level: logLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
    base: { service: config.service, environment: config.nodeEnv },
    redact: { paths: [...SENSITIVE_FIELDS], remove: true },
    mixin(_context, levelNumber) {
        const labels = { 10: "trace", 20: "debug", 30: "info", 40: "warn", 50: "error", 60: "fatal" };
        return { level_label: labels[levelNumber] || logLevel };
    }
})
```

Implemented as a factory function rather than one shared object literal
because three separate `pino(...)` instances are constructed below, each
needing an independent options object — a factory guarantees no
accidental shared-reference mutation between them.

`redact` is a genuine security control, not cosmetic: `SENSITIVE_FIELDS`
lists field paths (passwords, tokens, auth headers) that pino **deletes**
(`remove: true`) from any logged object before it's written anywhere —
preventing a careless `logger.info({ user })` call from ever leaking a
password hash or JWT into a log file on disk.

`mixin` runs on every single log call. Pino tracks levels internally as
numbers (`10`-`60`) for performance; this adds a human-readable
`level_label` string field to every log line, so log output is legible
without a lookup table.

### The three exported logger instances

```js
export const systemLogger = pino(getBaseConfig(), systemTransport)
export const auditLogger = pino(getBaseConfig(), auditTransport)
export const accessLogger = pino(getBaseConfig(), accessTarget)

export const loggers = { systemLogger, auditLogger, accessLogger }
```

`pino(options, destination)` — the two-argument constructor form. All
three loggers share identical *behavior* (same redaction rules, same
level mixin, same timestamp format) via `getBaseConfig()`, but each writes
to a physically separate set of files: system events, security/audit
events, and per-request access logs never mix in the same file. `loggers`
is a convenience bundle for any consumer that wants all three without
three separate named imports.

## Design Decisions & Rationale

| Decision | Rationale |
|---|---|
| Three separate logger instances instead of one | System, audit, and access concerns have different audiences and retention needs — keeping them in separate files makes each easier to search and reason about independently. |
| `sync: false` on all file transports | Prioritizes request-handling performance; accepts a small risk of losing the very last log line on an abrupt crash. |
| Dev-only `pino-pretty`, gated on `isDevelopment` | Avoids both a performance cost and a hard crash risk (loading a `devDependency` that was never installed) in production. |
| `redact` with `remove: true` | Guarantees sensitive fields are stripped before ever touching disk, rather than relying on every call site to remember not to log them. |
| Dedicated `app-error` file alongside `app-info` | Gives incident response a low-noise, errors-only view, despite the underlying duplication being intentional rather than exclusive routing. |

## Engineering Patterns Demonstrated

- Environment-gated behavior with a real failure mode in mind (not just a style preference)
- Structured logging with automatic PII/secret redaction
- Multiple purpose-scoped log streams instead of one undifferentiated stream
- Understanding and correctly using inclusive log-level semantics
- Factory functions to avoid shared mutable state across multiple constructed instances

---
[← Back to index](README.md) · Previous: [03. Shared Constants & Barrel Exports](03-constants-and-barrel-exports.md) · Next: [05. Custom Error Classes](05-custom-error-classes.md)
