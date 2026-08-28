import { AppError } from "./app.error.js";
import { HTTP_STATUS } from "../constants/index.js";

/**
 * 500 Internal Server Error — an unexpected failure with no more
 * specific category.
 */
class InternalServerError extends AppError{
    /**
     * @param {object} [options]
     * @param {string} [options.message="Internal server error"]
     * @param {string} [options.code="INTERNAL_SERVER_ERROR"]
     */
    constructor({
        message = "Internal server error",
        code = "INTERNAL_SERVER_ERROR"
    } = {}){
        super({
            message,
            statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            code,
        })
    }
}

export{
    InternalServerError,
}