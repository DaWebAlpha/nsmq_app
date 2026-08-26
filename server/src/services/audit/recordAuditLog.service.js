import { AuditLog } from "../../models/audit/auditLog.model.js";
import { auditLogger } from "../../logger/pino.logger.js";

/**
 * Writes one audit entry to both places AuditLog's own doc comment
 * promises: the queryable `AuditLog` collection (for in-app audit views)
 * and the file-based `auditLogger` (180-day-retained JSON logs, for
 * compliance/ops). Called from every mutating service after the actual
 * change has succeeded.
 * @param {object} params
 * @param {string} params.entityType
 * @param {string|import("mongoose").Types.ObjectId} params.entityId
 * @param {string} params.action - Namespaced action code, e.g. "user.banned".
 * @param {string|import("mongoose").Types.ObjectId|null} [params.performedBy]
 * @param {boolean} [params.isSystemAction=false]
 * @param {object|null} [params.changes] - Field-level diff.
 * @param {object|null} [params.metadata]
 * @param {string|null} [params.reason]
 * @param {"success"|"failure"} [params.status="success"]
 * @param {"info"|"warning"|"critical"} [params.severity="info"]
 * @param {string|null} [params.ipAddress]
 * @param {string|null} [params.userAgent]
 * @param {string|null} [params.deviceName]
 * @param {string|null} [params.deviceId]
 * @param {string|null} [params.requestId]
 * @param {import("mongoose").ClientSession} [params.session] - Passed through so this write commits atomically with the change it's logging.
 * @returns {Promise<void>}
 */
const recordAuditLog = async ({
    entityType,
    entityId,
    action,
    performedBy = null,
    isSystemAction = false,
    changes = null,
    metadata = null,
    reason = null,
    status = "success",
    severity = "info",
    ipAddress = null,
    userAgent = null,
    deviceName = null,
    deviceId = null,
    requestId = null,
    session = null,
} = {}) => {
    // WRITE 1 of 2: the file-based log (rotated, 180-day-retained JSON —
    // see pino.logger.js). Note this object intentionally leaves out
    // userAgent/deviceName/deviceId — the flat file log keeps a lighter
    // trace than the full database record below.
    auditLogger.info(
        {
            entityType,
            entityId,
            action,
            performedBy,
            isSystemAction,
            changes,
            metadata,
            reason,
            status,
            severity,
            ipAddress,
            requestId,
        },
        `Audit: ${action}`
    );

    // WRITE 2 of 2: the queryable AuditLog collection an admin UI reads
    // from — this one keeps every field, including device details.
    // `session ? {session} : undefined` makes it explicit: use a real
    // transaction session if the caller is inside one, otherwise none at all.
    await AuditLog.create(
        [{
            entityType,
            entityId,
            action,
            performedBy,
            isSystemAction,
            changes,
            metadata,
            reason,
            status,
            severity,
            ipAddress,
            userAgent,
            deviceName,
            deviceId,
            requestId,
        }],
        session ? { session } : undefined,
    );
};

export { recordAuditLog };
