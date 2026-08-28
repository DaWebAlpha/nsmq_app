import { AppError } from "./app.error.js";
import { HTTP_STATUS } from "../constants/index.js";

/**
 * 403 Forbidden — the client is authenticated but lacks permission.
 */
class ForbiddenError extends AppError{
    /**
     * @param {object} [options]
     * @param {string} [options.message="Forbidden error"]
     * @param {string} [options.code="FORBIDDEN_ERROR"]
     */
    constructor({
        message = "Forbidden error",
        code = "FORBIDDEN_ERROR",
    } = {}){
        super({
            message,
            statusCode: HTTP_STATUS.FORBIDDEN,
            code,
        })
    }
}

export {
    ForbiddenError,
}