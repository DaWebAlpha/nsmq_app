import { AppError } from "./app.error.js";
import { HTTP_STATUS } from "../constants/index.js";

/**
 * 404 Not Found — the requested resource does not exist.
 */
class NotFoundError extends AppError{
    /**
     * @param {object} [options]
     * @param {string} [options.message="Not found error"]
     * @param {string} [options.code="NOT_FOUND_ERROR"]
     */
    constructor({
        message = "Not found error",
        code = "NOT_FOUND_ERROR",
    } = {}){
        super({
            message,
            statusCode: HTTP_STATUS.NOT_FOUND,
            code
        })
    }
}


export {
    NotFoundError,
};