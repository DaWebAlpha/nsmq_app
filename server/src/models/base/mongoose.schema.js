import mongoose from "mongoose";
import {JSDOM } from "jsdom";
import createDOMPurify from "dompurify";
import { auditFields } from "./auditFields.js";
import { mongooseSchemaOptions } from "./mongoose.schema.options.js";
import {
    restoreDocument,
    softDeleteDocument,
    paginationCollection,
    updateDocument

} from "./helpers/index.js";


const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

/** Leaf field names that must never be run through HTML sanitization — hashed/opaque values that sanitizing or trimming would corrupt. */
const SANITIZE_EXCLUDED_PATHS = new Set([
    "password",
    "passwordHash",
    "token",
    "accessToken",
    "refreshToken",
    "secret",
    "secretKey",
    "apiKey",
]);


const hasOwn = (object, key) =>
    Object.prototype.hasOwnProperty.call(object, key);


/**
 * Strips HTML/scripts from a string via DOMPurify and trims it. Non-strings
 * pass through unchanged.
 * @param {*} value
 * @returns {*}
 */
const sanitizeString = (value) => {
    if(typeof value !== "string") return value;
    return DOMPurify.sanitize(value.normalize("NFC")).trim();
}

/**
 * Recursively sanitizes every string in a value (including inside nested
 * plain objects/arrays), skipping any key listed in
 * `SANITIZE_EXCLUDED_PATHS`. Not currently wired into `createSchema()`'s
 * `pre("validate")` hook below, which only sanitizes top-level modified
 * string paths — this is available for callers that need to sanitize a
 * nested object/array field directly.
 * @param {*} data
 * @returns {*}
 */
const sanitizeDeep = (data) => {
    if(data === null || data === undefined) return data;

    if(typeof data === "string") return sanitizeString(data);

    if(Array.isArray(data)){
        return data.map(item => sanitizeDeep(item));
    }

    if(typeof data === "object" && data.constructor === Object){
        const cleanObj = {};

        for(const [key, value] of Object.entries(data)){
            if (SANITIZE_EXCLUDED_PATHS.has(key)){
                cleanObj[key] = value;
            }else{
                cleanObj[key] = sanitizeDeep(value)
            }
        }
        return cleanObj;
    }
    return data;
}
/**
 * Builds a Mongoose schema with the app's shared conventions baked in:
 * `auditFields` merged into the definition, `mongooseSchemaOptions`
 * merged into the options, a `pre("validate")` hook that HTML-sanitizes
 * every modified string field (except `SANITIZE_EXCLUDED_PATHS`), and
 * `softDelete()`/`restore()`/`update()` instance methods plus a
 * `paginate()` static, all backed by `helpers/`.
 * @param {import("mongoose").SchemaDefinition} schemaDefinitions Model-specific fields.
 * @param {import("mongoose").SchemaOptions} [options] Overrides merged on top of `mongooseSchemaOptions`.
 * @returns {import("mongoose").Schema}
 */
const createSchema = (schemaDefinitions, options) => {
    const schema = new mongoose.Schema(
        {
            ...schemaDefinitions,
            ...auditFields

        },
        {
            ...mongooseSchemaOptions,
            ...options
        }
    )

    schema.pre("validate", function () {
            for (const path of this.modifiedPaths()) {
                const pathParts = path.split(".");
                const leafKey = pathParts[pathParts.length - 1];

                if (SANITIZE_EXCLUDED_PATHS.has(leafKey) || !isNaN(Number(leafKey))) {
                    continue;
                }

                const schemaPath = this.schema.path(path);
                if (!schemaPath || schemaPath.instance !== "String") {
                    continue;
                }

                const value = this.get(path);
                if (typeof value === "string") {
                    this.set(path, sanitizeString(value));
                }
            }
        });
    schema.methods.softDelete = function({
        deletedByUserId,
        reason,
        session
    } = {}){
        return softDeleteDocument({document: this, deleteByUserId: deletedByUserId, reason, session});
    }

    schema.methods.restore = function({
        restoredByUserId,
        reason,
        session
    } = {}){
        return restoreDocument({document: this, session, restoreByUserId: restoredByUserId, reason})
    }


    schema.methods.update = function({
        updatedByUserId,
        reason,
        session
    } = {}){
        return updateDocument({document: this, session, updateByUserId: updatedByUserId, reason});
    }

    schema.statics.paginate = function(params = {}){
        return paginationCollection({model: this, ...params});
    }
    return schema;
}

export {
    createSchema
}
