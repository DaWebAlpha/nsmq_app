import { SENSITIVE_FIELDS } from "../../constants/index.js";
import { config } from "../../config/index.js";

/**
 * Shared `toJSON`/`toObject` transform: replaces `_id` with a string
 * `id`, strips `__v` and every field listed in `SENSITIVE_FIELDS`, and
 * drops any field left `null`/`undefined`/blank so serialized documents
 * stay clean regardless of which model they came from.
 * @param {import("mongoose").Document} _document The original Mongoose document (unused).
 * @param {object} returnedObject The plain object being serialized.
 * @returns {object}
 */
const transformDocument = (_document, returnedObject) => {
    if(returnedObject._id){
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
    }

    delete returnedObject.__v;

    for(const field of SENSITIVE_FIELDS){
        delete returnedObject[field];
    }

    for(const [key, value] of Object.entries(returnedObject)){
        if(
            returnedObject[key] === null ||
            returnedObject[key] === undefined ||
           (typeof returnedObject[key] === "string" && value.trim() === "")
        ){
            delete returnedObject[key]
        }
    }

    return returnedObject;
}


/**
 * `toJSON`/`toObject` config shared by both: getters/virtuals enabled,
 * `transformDocument` applied.
 */
const serializationOptions = Object.freeze({
    getters: true,
    virtuals: true,
    transform: transformDocument,
});


/**
 * Base schema options every model built via the `createSchema()`
 * factory (not built yet) shares.
 */
const mongooseSchemaOptions = Object.freeze({
    timestamps: true,
    id: false,
    strict: true,
    strictQuery: true,
    minimize: false,
    optimisticConcurrency: true,
    autoIndex: config.nodeEnv === "development",
    toJSON: serializationOptions,
    toObject: serializationOptions,

})

export {
    mongooseSchemaOptions,
}