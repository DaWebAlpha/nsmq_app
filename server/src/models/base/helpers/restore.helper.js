/**
 * Restores a soft-deleted document: clears the delete audit fields and
 * sets the restore audit fields. A no-op (returns the document as-is, no
 * save) if it isn't currently deleted.
 * @param {object} [options]
 * @param {import("mongoose").Document} options.document
 * @param {string|import("mongoose").Types.ObjectId} [options.restoreByUserId=null]
 * @param {string} [options.reason=null]
 * @param {import("mongoose").ClientSession} [options.session=null]
 * @returns {Promise<import("mongoose").Document>}
 * @throws {Error} If `document` isn't provided.
 */
const restoreDocument = async ({
    document,
    restoreByUserId = null,
    reason = null,
    session = null
} = {}) => {
    if(!document){
        throw new Error("restoreDocument: Document is required");
    }

    if(!document.isDeleted){
        return document;
    }

    document.deletedAt = null;
    document.deleteReason = null;
    document.isDeleted = false;
    document.deletedBy = null;

    document.restoredBy = restoreByUserId;
    document.restoredAt = new Date();
    document.restoreReason = reason;

    return document.save({session, validateBeforeSave: false});
}

export {
    restoreDocument,
}