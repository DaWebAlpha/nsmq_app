import { AppError } from "./app.error.js";
import { HTTP_STATUS } from "../constants/index.js";

/** 429 Too Many Requests — the client has hit a rate limit. */
class TooManyRequestError extends AppError{
    /**
     * @param {object} [options]
     * @param {string} [options.message="Too many requests error"]
     * @param {string} [options.code="TOO_MANY_REQUESTS_ERROR"]
     */
    constructor({
        message = "Too many requests error",
        code = "TOO_MANY_REQUESTS_ERROR"
    } = {}){
        super({
            message,
            statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
            code
        })
    }
}

export {
    TooManyRequestError,
}