[← Back to index](README.md)

# 05. Custom Error Classes

**Files:** `server/src/errors/app.error.js`, `badRequest.error.js`, `unauthenticated.error.js`, `forbidden.error.js`, `notFound.error.js`, `conflict.error.js`, `internalServer.error.js`, `tooManyRequest.error.js`, `index.js`
**Layer:** Foundation (cross-cutting — used by controllers, services, and middleware)
**Depends on:** `constants/index.js` (`HTTP_STATUS`)
**Consumed by:** every controller/service that needs to signal a specific failure, and `middlewares/errorHandler.middleware.js`, which inspects the errors these classes produce

## Purpose

Provides a single, typed vocabulary for every *expected* failure the app
can produce — a bad request, a missing resource, a permission failure, a
duplicate record — so that code throughout the app can `throw new
NotFoundError()` instead of a bare `throw new Error("not found")`, and the
error-handling middleware downstream can reliably read a correct HTTP
status code and a safe, user-facing message off any error it catches.

## Code Walkthrough

### `app.error.js` — the shared base class

```js
class AppError extends Error {
    constructor({
        message = "Internal server error",
        code = "INTERNAL_SERVER_ERROR",
        statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR
    } = {}){
        super(message);
        this.code = code;
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.isOperational = true;
        if(Error.captureStackTrace){
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
```

**`extends Error` and `super(message)`:** `extends Error` sets up the
prototype chain, so every `AppError` (and its subclasses) is a real
`instanceof Error`. In a derived class, `this` doesn't exist until
`super()` runs — omitting `super(message)` entirely would make the very
next line, `this.code = code`, throw
`ReferenceError: Must call super constructor in derived class before
accessing 'this'`. `super(message)` runs `Error`'s own constructor bound
to the new instance, setting `this.message` and initializing `this.stack`.

**Destructured parameter with a default of `{}`:** the constructor
signature `({ message = ..., ... } = {})` lets every field default
independently *and* survive being called with zero arguments. Without the
trailing `= {}`, `new AppError()` would try to destructure `undefined`
and throw `TypeError: Cannot destructure property 'message' of 'undefined'
as it is not an object`.

**`this.name = this.constructor.name`:** `this.constructor` always
resolves to the actual class used with `new`, not necessarily `AppError`
itself — so this same line, written once in the base class, correctly
yields `"BadRequestError"`, `"NotFoundError"`, etc. depending on which
subclass was actually instantiated. A small but real bit of polymorphism:
the base class adapts to whichever child calls it without needing to know
its subclasses in advance.

**`this.isOperational = true`:** marks this as an *expected*, anticipated
failure (bad input, missing resource) as opposed to a genuine bug (e.g. a
`TypeError` from calling a method on `undefined`). The error-handling
middleware checks this flag: if `true`, it's safe to send `err.message`
directly to the client; if `false` — a plain, non-`AppError` exception —
it responds with a generic message instead, while still logging the real
error internally, so an unexpected bug never leaks internal details (stack
traces, variable names) into an API response.

**`Error.captureStackTrace`:** a V8-specific API (Node.js/Chrome), not
part of the ECMAScript standard — other engines like Firefox's
SpiderMonkey don't have it. The `if` guard is feature detection, keeping
the class portable. When present, it builds `this.stack` while excluding
the `AppError` constructor's own frame, so the trace starts at the actual
application code that threw the error.

### The seven subclasses — one consistent shape

Every subclass follows the identical pattern — its own default
`message`/`code`, and a **hardcoded** `statusCode` passed up to
`AppError` via `super(...)`. All seven, in full:

```js
// badRequest.error.js — 400 Bad Request: the request is malformed or fails validation.
class BadRequestError extends AppError {
    constructor({
        message = "Bad request error",
        code = "BAD REQUEST ERROR"
    } = {}){
        super({
            message,
            code,
            statusCode: HTTP_STATUS.BAD_REQUEST
        })
    }
}
```

```js
// unauthenticated.error.js — 401 Unauthenticated: no valid credentials were supplied.
class UnauthenticatedError extends AppError {
    constructor({
        message = "Unauthenticated error",
        code = "UNAUTHENTICATED_ERROR",
    } = {}){
        super({
            message,
            statusCode: HTTP_STATUS.UNAUTHENTICATED,
            code,
        })
    }
}
```

```js
// forbidden.error.js — 403 Forbidden: the client is authenticated but lacks permission.
class ForbiddenError extends AppError {
    constructor({
        message = "Forbidden error",
        code = "FORBIDDEN_ERROR",
    } = {}){
        super({
            message,
            statusCode: HTTP_STATUS.FORBIDDEN,
            code,
        })
    }
}
```

```js
// notFound.error.js — 404 Not Found: the requested resource does not exist.
class NotFoundError extends AppError {
    constructor({
        message = "Not found error",
        code = "NOT_FOUND_ERROR",
    } = {}){
        super({
            message,
            statusCode: HTTP_STATUS.NOT_FOUND,
            code
        })
    }
}
```

```js
// conflict.error.js — 409 Conflict: the request conflicts with existing state (e.g. duplicate key).
class ConflictError extends AppError {
    constructor({
        message = "Conflict error",
        code = "CONFLICT_ERROR",
    } = {}){
        super({
            message,
            code,
            statusCode: HTTP_STATUS.CONFLICT,
        })
    }
}
```

```js
// tooManyRequest.error.js — 429 Too Many Requests: the client has hit a rate limit.
class TooManyRequestError extends AppError {
    constructor({
        message = "Too many requests error",
        code = "TOO_MANY_REQUESTS_ERROR"
    } = {}){
        super({
            message,
            statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
            code
        })
    }
}
```

```js
// internalServer.error.js — 500 Internal Server Error: an unexpected failure with no more specific category.
class InternalServerError extends AppError {
    constructor({
        message = "Internal server error",
        code = "INTERNAL_SERVER_ERROR"
    } = {}){
        super({
            message,
            statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            code,
        })
    }
}
```

Quick reference for the same seven:

| Class | HTTP Status | Default message | Default code |
|---|---|---|---|
| `BadRequestError` | 400 | "Bad request error" | `BAD REQUEST ERROR` |
| `UnauthenticatedError` | 401 | "Unauthenticated error" | `UNAUTHENTICATED_ERROR` |
| `ForbiddenError` | 403 | "Forbidden error" | `FORBIDDEN_ERROR` |
| `NotFoundError` | 404 | "Not found error" | `NOT_FOUND_ERROR` |
| `ConflictError` | 409 | "Conflict error" | `CONFLICT_ERROR` |
| `TooManyRequestError` | 429 | "Too many requests error" | `TOO_MANY_REQUESTS_ERROR` |
| `InternalServerError` | 500 | "Internal server error" | `INTERNAL_SERVER_ERROR` |

Note `BadRequestError`'s default `code` is `"BAD REQUEST ERROR"` (with
spaces) while every other class uses `SCREAMING_SNAKE_CASE` with
underscores (`"UNAUTHENTICATED_ERROR"`, `"CONFLICT_ERROR"`, etc.) — a real
inconsistency in the current code, not a formatting choice in this doc.
Since `code` is meant to be a machine-readable identifier (for client-side
error handling, i18n lookups, etc.), this stray space is worth normalizing
to `"BAD_REQUEST_ERROR"` for consistency with its siblings.

The `statusCode` is deliberately **not** an argument a caller can pass in
— it's fixed inside each subclass. This is the actual point of having
seven distinct classes instead of one generic `AppError` with a status
argument: it makes it structurally impossible to accidentally construct a
`NotFoundError` that responds with a 500, or a `BadRequestError` that
responds with 404. The type of the error *is* the status code; call sites
only ever customize the message and machine-readable code.

### `errors/index.js` — barrel export

Same pattern and rationale as `constants/index.js` (see
[03-constants-and-barrel-exports.md](03-constants-and-barrel-exports.md)):
every consumer imports from one stable path,
`import { NotFoundError } from "../errors/index.js"`, regardless of how
the individual files under `errors/` are organized.

## Design Decisions & Rationale

| Decision | Rationale |
|---|---|
| Typed subclass per HTTP status, rather than one class with a status argument | Makes it structurally impossible to pair the wrong status code with an error category — the class itself encodes the status. |
| `isOperational` flag on every instance | Lets the error-handling middleware distinguish safe-to-expose failures from real bugs, without inspecting error messages or types elsewhere in the app. |
| Every subclass constructor accepts optional `{ message, code }` | Callers get a sensible default out of the box (`throw new NotFoundError()`) but can override the message for context (`throw new NotFoundError({ message: "Note not found" })`) without needing to know or repeat the status code. |
| `Error.captureStackTrace` guarded behind a feature check | Keeps the base class from crashing outright in a non-V8 JS engine, even though this project only runs on Node. |

## Engineering Patterns Demonstrated

- Custom error hierarchies (`extends Error` → shared base → typed subclasses) for structured, catchable failure handling
- Operational vs. programmer-error distinction as a first-class flag, not an implicit convention
- Encoding an invariant (status code ↔ error category) into the type system rather than trusting every call site to get it right
- Defensive constructor design: safe defaults, safe destructuring of missing arguments, environment feature detection
- Barrel-file re-exports applied consistently across the codebase, not just in one folder

---
[← Back to index](README.md) · Previous: [04. Structured Logging with Pino](04-pino-logger.md)
