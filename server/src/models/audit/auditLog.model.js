import mongoose from "mongoose";
import { mongooseSchemaOptions } from "../base/mongoose.schema.options.js";

const { ObjectId, Mixed } = mongoose.Schema.Types;

/**
 * Append-only activity ledger — who did what, to what, when, and with what
 * result, across every collection in the app. Deliberately built with a plain
 * `mongoose.Schema` rather than `createSchema` (see models/base/mongoose.schema.js):
 * an audit entry must never be soft-deleted or "updated" after it's written,
 * so the mutable-audit-trail machinery every other model gets doesn't apply
 * here. Only `mongooseSchemaOptions` is reused, for consistent serialization.
 */
const auditLogSchema = new mongoose.Schema(
    {
        entityType: {
            type: String,
            required: [true, "Entity type is required"],
        },
        entityId: {
            type: ObjectId,
            required: [true, "Entity id is required"],
            // `refPath` (instead of a fixed `ref: "SomeModel"`) makes this a
            // POLYMORPHIC reference: Mongoose looks at THIS document's own
            // `entityType` field (e.g. "User", "Note") to decide which
            // model `entityId` actually points to. One AuditLog collection
            // can then reference documents from any model in the app.
            refPath: "entityType"
        },
        action: {
            type: String,
            trim: true,
            required: [true, "Action is required"],
        },
        performedBy: {
            type: ObjectId,
            ref: "User",
            default: null
        },
        /**
         * True when `performedBy` is null because the system, not a
         * user, did this (e.g. a scheduled cleanup job) — makes that
         * intent explicit instead of implied by a null check.
         */
        isSystemAction: {
            type: Boolean,
            default: false
        },
        changes: {
            type: Mixed,
            default: null,
        },
        metadata: {
            type: Mixed,
            default: null
        },
        reason: {
            type: String,
            default: null,
        },
        /**
         * Whether the action actually went through — lets
         * denied/failed attempts (e.g. a permission check that
         * blocked a delete) be logged too, not just completed ones.
         */
        status: {
            type: String,
            enum: ["success", "failure"],
            default: "success",
        },
        /**
         * Lets security-relevant entries (e.g. a role escalation) be
         * filtered/alerted on separately from routine ones.
         */
        severity: {
            type: String,
            enum: ["info", "warning", "critical"],
            default: "info",
        },
        ipAddress: {
            type: String,
            default: null,
        },
        userAgent: {
            type: String,
            default: null,
        },
        deviceName: {
            type: String,
            default: null,
        },
        deviceId: {
            type: String,
            default: null,
        },
        /**
         * pino-http's auto-generated `request.id` (see app.js) —
         * correlates this entry to the exact HTTP request and its
         * matching accessLogger/auditLogger file log lines.
         */
        requestId: {
            type: String,
            default: null,
        },
    },
    {
        ...mongooseSchemaOptions,
        timestamps: {
            createdAt: true,
            updatedAt: false
        }

    }
)



auditLogSchema.index({entityType: 1, entityId: 1, createdAt: -1});
auditLogSchema.index({performedBy: 1, createdAt: -1});
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ status: 1, createdAt: -1 });
auditLogSchema.index({ severity: 1, createdAt: -1 });


/**
 * The AuditLog Mongoose Model — collection `auditlogs`.
 */
const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export {
    AuditLog
}
