/**
 * Like sendResponse.js, but built for actions that end in a REDIRECT for
 * browser clients instead of a rendered view — e.g. after a successful
 * login/registration, where the next step is "go to the dashboard," not
 * "render a page here." JSON clients still just get a JSON body back.
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @param {object} [options]
 * @param {boolean} options.success
 * @param {string} options.message
 * @param {string} options.redirectTo - Where to send a browser client.
 * @param {number} [options.status] - Defaults to 200 if success, 400 if not.
 * @returns {import("express").Response}
 */
const responseAction = (
    request,
    response,
    {
        success,
        message,
        redirectTo,
        status,
    }
 = {}) => {
    const wantsJson = request.accepts(["html", "json"]) === "json";
    const statusCode = status ?? (success ? 200 : 400);

    if (wantsJson) {
        return response.status(statusCode).json({ success, message, redirectTo });
    }

    // Optional chaining: `request.flash` only exists if a flash-message
    // middleware (e.g. connect-flash) is set up — which app.js doesn't do
    // yet, so this is currently a safe no-op rather than a crash.
    request.flash?.(success ? "success" : "error", message);

    return response.redirect(redirectTo);
};

// Named export only — matches this codebase's convention of no default
// exports anywhere, for consistent import syntax across every file.
export { responseAction };
