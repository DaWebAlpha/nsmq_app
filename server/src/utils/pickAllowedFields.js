/** Copies only the keys in `allowedFields` (that are actually present on `source`) into a new object — a generic allowlist filter with no domain knowledge of any one model's fields. */
const pickAllowedFields = (source = {}, allowedFields = []) => {
    const result = {};

    for (const field of allowedFields) {
        if (source[field] !== undefined) {
            result[field] = source[field];
        }
    }

    return result;
};

export { pickAllowedFields };
