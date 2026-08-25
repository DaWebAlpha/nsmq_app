import { AppError } from "./app.error.js";
import { HTTP_STATUS } from "../constants/index.js";

/** 400 Bad Request — the request is malformed or fails validation. */
class BadRequestError extends AppError{
    /**
     * @param {object} [options]
     * @param {string} [options.message="Bad request error"]
     * @param {string} [options.code="BAD REQUEST ERROR"]
     */
    constructor({
        message = "Bad request error",
        code = "BAD REQUEST ERROR"
    } = {}){
        super({
            message,
            code,
            statusCode: HTTP_STATUS.BAD_REQUEST
        })
    }
}

export {
    BadRequestError,
}