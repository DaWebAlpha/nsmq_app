import { BadRequestError, ConflictError } from "../errors/index.js";

/**
 * Translates a raw Mongoose/MongoDB write error into one of this app's
 * typed `AppError` subclasses, so callers never have to inspect
 * `error.code`/`error.name` themselves. Always throws — never returns —
 * so callers can just call it inside a `catch` block without wrapping
 * the call in their own `throw`.
 * @param {*} error - The error caught from a Mongoose write (`.create()`, `.save()`, etc.).
 * @throws {ConflictError} If `error` is a duplicate-key error (E11000).
 * @throws {BadRequestError} If `error` is a Mongoose `ValidationError`.
 * @throws {*} Re-throws `error` unchanged if it isn't one of the above.
 */
const translateMongooseWriteError = (error) => {
    // CASE 1: a duplicate-key error. `11000` is MongoDB's fixed numeric
    // code for this — it means a `unique: true` index (like User.email)
    // rejected the write because the value is already taken.
    if (error?.code === 11000) {
        // `error.keyValue` is an object like `{ email: "taken@x.com" }` —
        // grab the first (usually only) field name that collided, so the
        // error message can say WHICH field, not just "duplicate."
        const field = Object.keys(error.keyValue || {})[0] || "field";

        throw new ConflictError({
            message: `${field} is already in use`,
            code: `DUPLICATE_${field.toUpperCase()}`,
        });
    }

    // CASE 2: a schema validation failure (a `required` field missing, a
    // custom `validate` function returning false, etc.).
    if (error?.name === "ValidationError") {
        // `error.errors` is an object keyed by field name, each value
        // holding its own `.message`. Join every field's message together
        // so ALL validation problems are reported at once, not just the
        // first one Mongoose happened to hit.
        const message = Object.values(error.errors || {})
            .map((validatorError) => validatorError.message)
            .join(", ") || "Validation failed";

        throw new BadRequestError({
            message,
            code: "VALIDATION_ERROR",
        });
    }

    // CASE 3: anything else — a genuine, unexpected error. Re-throw it
    // completely unchanged; this function only translates the two
    // specific, expected shapes above.
    throw error;
};

export { translateMongooseWriteError };
