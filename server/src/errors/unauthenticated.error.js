import { AppError } from "./app.error.js";
import { HTTP_STATUS } from "../constants/index.js";

/**
 * 401 Unauthenticated — no valid credentials were supplied.
 */
class UnauthenticatedError extends AppError{
    /**
     * @param {object} [options]
     * @param {string} [options.message="Unauthenticated error"]
     * @param {string} [options.code="UNAUTHENTICATED_ERROR"]
     */
    constructor({
        message = "Unauthenticated error",
        code = "UNAUTHENTICATED_ERROR",
    } = {}){
        super({
            message,
            statusCode: HTTP_STATUS.UNAUTHENTICATED,
            code,
        })
    }
}

export {
    UnauthenticatedError,
}