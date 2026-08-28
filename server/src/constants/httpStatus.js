/**
 * Frozen map of HTTP status codes used across the app's error classes
 * and responses.
 */
const HTTP_STATUS = Object.freeze({
    CONTINUE: 100,
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    URL_MOVED_PERMANENTLY: 301,
    URL_CHANGED_TEMPORARILY: 302,
    BAD_REQUEST: 400,
    UNAUTHENTICATED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
})

export {
    HTTP_STATUS,
}