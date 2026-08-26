import crypto from "node:crypto";

/**
 * Caches a generated device ID per-request, so calling getDeviceId(request)
 * more than once during the same request returns the same value instead of
 * minting a new random UUID each time. Keyed by the request object itself,
 * so entries are garbage-collected automatically once the request ends.
 */
const DEVICE_ID_CACHE = new WeakMap();


/**
 * Reads a single header value off a request, unwrapping it if Node parsed
 * it as an array (which happens for headers sent multiple times).
 * @param {import("express").Request} request
 * @param {string} name - Lowercase header name.
 * @returns {string|undefined}
 */
const getHeader = (request, name) => {
    const value = request.headers?.[name];

    return Array.isArray(value)
        ? value[0]
        : value;

}



/**
 * Trims a string, or returns "" for non-string input.
 * @param {*} value
 * @returns {string}
 */
const normalize = (value) => {
    return typeof value === "string"
        ? value.trim()
        : ""
}

/**
 * Best-effort client IP: Express's own resolved `request.ip` first (which
 * respects the app's `trust proxy` setting), then the usual proxy headers,
 * then the raw socket address, falling back to `"unknown"` rather than
 * an empty string if nothing is available.
 * @param {import("express").Request} request
 * @returns {string}
 */
const getClientIP = (request) => {
    // Try each source in order, from most to least trustworthy, falling
    // back to the next one only if the previous is missing/empty:
    // 1. request.ip — Express's own resolved value (honors `trust proxy`).
    // 2. x-forwarded-for — the standard proxy header; may list several
    //    IPs comma-separated (the client hopped through), so take just
    //    the FIRST one.
    // 3. x-real-ip — a common alternative some proxies set instead.
    // 4. The raw socket's remote address — whoever connected directly.
    // 5. "unknown" — if literally none of the above gave anything.
    const raw =
        request.ip ||
        getHeader(request, "x-forwarded-for")?.split(",")[0] ||
        getHeader(request, "x-real-ip") ||
        request.socket?.remoteAddress ||
        "unknown";
    return normalize(raw);
};

/**
 * The request's User-Agent header, trimmed, or null if absent.
 * @param {import("express").Request} request
 * @returns {string|null}
 */
const getUserAgent = (request) => {
    return normalize(getHeader(request, "user-agent")) || null;
};

/**
 * A client-supplied device name, read from the JSON body or either of two
 * accepted header spellings, or null if none was provided.
 * @param {import("express").Request} request
 * @returns {string|null}
 */
const getDeviceName = (request) => {
    const raw =
        request.body?.device_name ||
        getHeader(request, "x-device-name") ||
        getHeader(request, "device-name");
    return normalize(raw) || null;
};


/**
 * A stable device ID for this request: whatever the client supplied (body
 * field or either accepted header), or a freshly generated UUID if none
 * was given. The result is cached per-request via {@link DEVICE_ID_CACHE}
 * so a generated UUID stays consistent across multiple calls within the
 * same request instead of changing each time.
 * @param {import("express").Request} request
 * @returns {string}
 */
const getDeviceId = (request) => {
    // IF this exact request object was already processed once, return the
    // SAME id again — without this cache, calling getDeviceId(request)
    // twice in one request (once for a LoginLog write, once for a
    // RefreshToken write, say) would generate two DIFFERENT random UUIDs.
    if (DEVICE_ID_CACHE.has(request)) {
        return DEVICE_ID_CACHE.get(request);
    }

    // Prefer whatever the client actually sent...
    const raw =
        request.body?.device_id ||
        getHeader(request, "x-device-id") ||
        getHeader(request, "device-id");
    // ...but if the client sent nothing at all, mint a fresh random UUID
    // so this request still gets SOME device id.
    const deviceId = normalize(raw) || crypto.randomUUID();

    DEVICE_ID_CACHE.set(request, deviceId);
    return deviceId;
};

export {
    getClientIP,
    getUserAgent,
    getDeviceName,
    getDeviceId,
};
