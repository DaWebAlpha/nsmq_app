import { AppError } from "./app.error.js";
import { HTTP_STATUS } from "../constants/index.js";

/** 409 Conflict — the request conflicts with existing state (e.g. duplicate key). */
class ConflictError extends AppError{
    /**
     * @param {object} [options]
     * @param {string} [options.message="Conflict error"]
     * @param {string} [options.code="CONFLICT_ERROR"]
     */
    constructor({
        message = "Conflict error",
        code = "CONFLICT_ERROR",
    } = {}){
        super({
            message,
            code,
            statusCode: HTTP_STATUS.CONFLICT,
        })
    }
}

export {
    ConflictError,
}