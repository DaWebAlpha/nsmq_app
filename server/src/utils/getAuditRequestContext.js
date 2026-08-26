import { getClientIP, getUserAgent, getDeviceName, getDeviceId } from "./request.js";

/**
 * Bundles the request-context fields every AuditLog entry wants
 * (ip/user-agent/device/request id) so each controller doesn't repeat the
 * same four calls. `request.id` comes from pino-http (mounted in app.js).
 * @param {import("express").Request} request
 * @returns {{ipAddress: string, userAgent: string|null, deviceName: string|null, deviceId: string, requestId: string|null}}
 */
const getAuditRequestContext = (request) => ({
    ipAddress: getClientIP(request),
    userAgent: getUserAgent(request),
    deviceName: getDeviceName(request),
    deviceId: getDeviceId(request),
    // `request.id` is set by pino-http (see app.js) — `|| null` normalizes
    // a missing value to an explicit null instead of `undefined`, so it
    // never silently disappears once spread into a document/log entry.
    requestId: request.id || null,
});

export { getAuditRequestContext };
