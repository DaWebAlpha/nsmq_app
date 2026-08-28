import mongoose from "mongoose";
import { mongooseSchemaOptions } from "../base/mongoose.schema.options.js";

const {ObjectId } = mongoose.Schema.Types;

/**
 * One entry per successful login — a companion ledger to FailedLoginLog for
 * spotting activity patterns (new device, new location, etc.). Deliberately
 * built with a plain `mongoose.Schema` rather than `createSchema`: it's
 * append-only, so the mutable-audit-trail machinery doesn't apply here.
 */
const loginLogSchemaDefinition = {
    userId: {
        type: ObjectId,
        ref: "User",
        default: null,
    },
    identifier: {
        type: String,
        required: [true, "Identifier is required"],
    },
    reason: {
        type: String,
        default: null
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
}

const loginLogSchema = new mongoose.Schema(loginLogSchemaDefinition,
    {
        ...mongooseSchemaOptions,
        timestamps: {createdAt: true, updatedAt: false},
    }
);


// Fast lookup: "all login events for this one user, newest first."
loginLogSchema.index({ userId: 1, createdAt: -1 });

/**
 * TTL index — MongoDB automatically deletes entries ~180 days after
 * createdAt.
 */
// 60 (seconds) * 60 (minutes) * 24 (hours) * 180 (days) = the number of
// seconds after `createdAt` that MongoDB will delete this document.
loginLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

/**
 * The LoginLog Mongoose Model — collection `loginlogs`.
 */
const LoginLog = mongoose.model("LoginLog", loginLogSchema);

export {
    LoginLog,
}
