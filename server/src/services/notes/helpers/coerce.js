import { BadRequestError } from "../../../errors/index.js";

/**
 * Coerces a query-string value into a real boolean. Unrecognized input
 * (including `undefined`) silently resolves to `false` rather than throwing.
 * @param {*} value - e.g. "true"/"false"/"on"/"off"/"1"/"0", or an actual boolean.
 * @returns {boolean}
 */
const coerceBooleanField = (value) => {
    if (value === true || value === "true" || value === "on" || value === "1") {
        return true;
    }

    if (value === false || value === "false" || value === "off" || value === "0") {
        return false;
    }

    return false;
};

/**
 * Coerces a query-string value into a non-negative whole number, throwing
 * a clean BadRequestError instead of letting bad input reach the database.
 * @param {*} value - e.g. "3", or an actual number.
 * @param {string} fieldName - Used in the error message, e.g. "Topic number".
 * @returns {number}
 * @throws {BadRequestError} If value isn't a whole number, or is negative.
 */
const coerceOrderNumber = (value, fieldName) => {
    const numberValue = Number(value ?? 0);

    if (!Number.isInteger(numberValue)) {
        throw new BadRequestError({ message: `${fieldName} must be a whole number` });
    }

    if (numberValue < 0) {
        throw new BadRequestError({ message: `${fieldName} cannot be negative` });
    }

    return numberValue;
};

export { coerceBooleanField, coerceOrderNumber };
