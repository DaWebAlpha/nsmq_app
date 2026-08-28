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
   
    if (error?.code === 11000) {
        const field = Object.keys(error.keyValue || {})[0] || "field";
        throw new ConflictError({
            message: `${field} is already in use`,
            code: `DUPLICATE_${field.toUpperCase()}`,
        });
    }

   
    if (error?.name === "ValidationError") {
        const message = Object.values(error.errors || {})
            .map((validatorError) => validatorError.message)
            .join(", ") || "Validation failed";

        throw new BadRequestError({
            message,
            code: "VALIDATION_ERROR",
        });
    }

    throw error;
};

export { translateMongooseWriteError };
