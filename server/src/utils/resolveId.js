/**
 * Normalizes a Mongoose document (or a plain `{id}`/`{_id}` object) down to
 * a plain string id, or `null` if neither shape is present.
 * @param {import("mongoose").Document|{id?: string}|{_id?: import("mongoose").Types.ObjectId}|null|undefined} doc
 * @returns {string|null}
 */
const resolveId = (doc) => {
    const id = doc?.id ?? doc?._id ?? null;
    return id ? id.toString() : null;
};

export { resolveId };
