import mongoose from "mongoose";

import {
    BadRequestError,
    NotFoundError
} from "../errors/index.js";


/**
 * Fetches a single document by id, throwing standardized errors instead of
 * returning null/undefined when the id is missing or nothing matches.
 * @param {import("mongoose").Model} Model - The Mongoose model to query.
 * @param {string|import("mongoose").Types.ObjectId} id - The document id to look up.
 * @param {object} [options]
 * @param {string} [options.idMessage="Id is required"] - Message used when id is falsy.
 * @param {string} [options.idCode="ID_REQUIRED"] - Error code used when id is falsy.
 * @param {string} [options.notFoundMessage="Resource not found"] - Message used when no document matches.
 * @param {string} [options.notFoundCode="NOT_FOUND"] - Error code used when no document matches.
 * @param {object} [options.filter={}] - Extra query conditions merged with `_id`.
 * @param {object|string|null} [options.projection=null] - Fields to select.
 * @returns {Promise<import("mongoose").Document>} The matched document.
 * @throws {BadRequestError} If id is falsy.
 * @throws {NotFoundError} If no document matches.
 */
const fetchOrNotFound = async(Model, id, {
    idMessage = "Id is required",
    idCode = "ID_REQUIRED",
    notFoundMessage = "Resource not found",
    notFoundCode = "NOT_FOUND",
    filter = {},
    projection = null
} = {}) => {
    
    if(!id){
        throw new BadRequestError({
            message: idMessage,
            code: idCode
        })
    }

    // CHECK 2: does `id` even LOOK like a valid Mongo ObjectId? This runs
    // BEFORE the query so a garbage string never reaches MongoDB and
    // throws a raw, ugly CastError — it fails cleanly here instead, with
    // the SAME error type as "not found" (see the note below).
    if(!mongoose.isValidObjectId(id)){
        throw new NotFoundError({
            message: notFoundMessage,
            code: notFoundCode
        })
    }

    // Run the actual lookup — `filter` lets a caller add extra conditions
    // (like `{isDeleted: false}`) beyond just matching `_id`.
    const document = await Model.findOne(
        {
            _id: id,
            ...filter
        },
        projection
    );

    // CHECK 3: did anything actually match? A malformed id (Check 2) and a
    // well-formed-but-nonexistent id (this check) BOTH become the same
    // NotFoundError — deliberately, so neither response leaks information
    // about which ids in the system are real.
    if(!document){
        throw new NotFoundError({
            message: notFoundMessage,
            code: notFoundCode
        })
    }

    return document;
}

export { fetchOrNotFound };
