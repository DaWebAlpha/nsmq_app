import { HTTP_STATUS } from "../constants/index.js";

/**
 * Base class for all operational (expected/handled) errors in the app.
 * Subclasses set the HTTP status code and default message/code for one
 * error category (bad request, not found, etc.).
 */
class AppError extends Error{
    /**
     * @param {object} [options]
     * @param {string} [options.message="Internal server error"] Human-readable error message.
     * @param {string} [options.code="INTERNAL_SERVER_ERROR"] Machine-readable error code.
     * @param {number} [options.statusCode=HTTP_STATUS.INTERNAL_SERVER_ERROR] HTTP status code to respond with.
     */
    constructor({
        message = "Internal server error",
        code = "INTERNAL_SERVER_ERROR",
        statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR
    } = {}){
        super(message);
        this.code = code;
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.isOperational = true;
        if(Error.captureStackTrace){
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export {
    AppError,
};
