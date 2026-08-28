# nsmq_app — Backend Architecture Documentation

`nsmq_app` is a MERN-stack application (Node.js/Express, MongoDB via
Mongoose, EJS views) built with a layered backend architecture:

```
routes → controllers → services → models
              ↑
        middlewares (auth, error handling)
              ↑
   config / constants / errors / logger / utils  (shared foundation)
```

This directory documents that backend file by file, in the order each
layer depends on the one below it — starting from environment
configuration and working up through models, services, controllers,
routes, and finally view rendering. Each document explains not just what
the code does, but the reasoning behind each design decision, so the
document set doubles as a written record of the architecture.

## Contents

| # | Document | Covers |
|---|----------|--------|
| 01 | [Environment Configuration Loading](01-config-env-loading.md) | `config/index.js` — loading, validating, and freezing environment variables into a single typed config object |
| 02 | [Database Connection Layer](02-database-connection.md) | `config/database.js` — connecting to MongoDB via Mongoose, connection-lifecycle logging, fail-fast error propagation |
| 03 | [Shared Constants & Barrel Exports](03-constants-and-barrel-exports.md) | The full `constants/` folder — Mongo pool tuning, HTTP status codes, note subjects, user roles, account-lockout thresholds, log-redaction patterns, and the barrel-export pattern tying them together |
| 04 | [Structured Logging with Pino](04-pino-logger.md) | `logger/pino.logger.js` — three purpose-scoped loggers, daily-rotated file transports, redaction, and dev-only pretty printing |
| 05 | [Custom Error Classes](05-custom-error-classes.md) | `errors/` — a typed error hierarchy (`AppError` base + 7 HTTP-status subclasses), the operational-vs-bug distinction, and how status codes get encoded into the type system |

## Conventions used throughout this app

- **ESM everywhere** (`"type": "module"` in `package.json`) — `import`/`export`, not `require`.
- **Fail fast on missing critical config** — the app refuses to start rather than run in a broken state.
- **Immutable shared state** — config-like objects are wrapped in `Object.freeze()`.
- **Barrel files** (`index.js` re-exporting a folder's contents) so consumers import from one path instead of reaching into internal files.
- **Layered error handling** — errors are logged at the point they occur, then re-thrown so a single caller (ultimately `server.js`) decides how to fail.
