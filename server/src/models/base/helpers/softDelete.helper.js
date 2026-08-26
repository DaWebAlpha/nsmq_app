/**
 * Soft-deletes a document: sets the delete audit fields and clears any
 * prior restore fields. A no-op (returns the document as-is, no save)
 * if it's already deleted.
 * @param {object} [options]
 * @param {import("mongoose").Document} options.document
 * @param {string|import("mongoose").Types.ObjectId} [options.deleteByUserId=null]
 * @param {string} [options.reason=null]
 * @param {import("mongoose").ClientSession} [options.session=null]
 * @returns {Promise<import("mongoose").Document>}
 * @throws {Error} If `document` isn't provided.
 */
const softDeleteDocument = async ({
    document,
    deleteByUserId = null,
    reason = null,
    session = null
} = {}) => {

    if(!document){
        throw new Error("SoftDeleteDocument: document is required")
    }

    if(document.isDeleted){
        return document;
    }

    document.deletedBy = deleteByUserId;
    document.isDeleted = true;
    document.deletedAt = new Date();
    document.deleteReason = reason;

    document.restoredAt = null;
    document.restoredBy = null;
    document.restoreReason = null;

    return document.save({session, validateBeforeSave: false});
}
export {
    softDeleteDocument,
};

