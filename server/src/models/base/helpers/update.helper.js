import { BadRequestError } from "../../../errors/index.js";


/**
 * Updates a document's audit fields (`updatedBy`/`isUpdated`/
 * `updateReason`) and saves it. Refuses to update a soft-deleted
 * document.
 * @param {object} [options]
 * @param {import("mongoose").Document} options.document
 * @param {string|import("mongoose").Types.ObjectId} [options.updateByUserId=null]
 * @param {string} [options.reason=null]
 * @param {import("mongoose").ClientSession} [options.session=null]
 * @returns {Promise<import("mongoose").Document>}
 * @throws {Error} If `document` isn't provided.
 * @throws {BadRequestError} If `document.isDeleted` is true.
 */
const updateDocument = async({
    document,
    updateByUserId = null,
    reason = null,
    session = null
} = {}) => {
    if(!document){
        throw new Error("updateDocument: document is required");
    }

    if(document.isDeleted){
        throw new BadRequestError({
            message: "Deleted document cannot be updated",
            code: "DELETED_DOCUMENTS_CANNOT_BE_UPDATED",
        })
    }

    document.updatedBy = updateByUserId;
    document.isUpdated = true;
    document.updateReason = reason;

    return document.save({session, validateBeforeSave: false});
}

export {
    updateDocument,
} 