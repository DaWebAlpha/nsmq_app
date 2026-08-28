import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

/**
 * Schema options for a `User` reference field (createdBy/updatedBy/
 * etc.), defaulting to unset.
 */
const fieldOptions = Object.freeze({
    type: ObjectId,
    ref: "User",
    default: null,
});

/**
 * Schema options for an audit timestamp field, defaulting to unset.
 */
const dateOptions = Object.freeze({
    type: Date,
    default: null
})

/**
 * Schema options for a free-text audit reason field, defaulting to
 * unset.
 */
const reasonOptions = Object.freeze({
    type: String,
    default: null
})

/**
 * Schema options for an audit flag field, defaulting to false.
 */
const booleanOptions = Object.freeze({
    type: Boolean,
    default: false,
})


/**
 * Shared soft-delete/audit-trail fields spread into any schema built via
 * the `createSchema()` factory — who created/updated/deleted/restored a
 * document, when, and why. Safe to reuse the same frozen options object
 * across multiple field paths since every default value here is a
 * primitive (`null`/`false`), not a shared mutable reference.
 */
const auditFields = Object.freeze({
    createdBy: fieldOptions,
    deletedBy: fieldOptions,
    updatedBy: fieldOptions,
    restoredBy: fieldOptions,

    deletedAt: dateOptions,
    restoredAt: dateOptions,

    isDeleted: booleanOptions,
    isUpdated: booleanOptions,

    restoreReason: reasonOptions,
    deleteReason: reasonOptions,
    updateReason: reasonOptions,
})

export {
    auditFields,
}