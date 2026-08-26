import mongoose from "mongoose";
import { mongooseSchemaOptions } from "../base/mongoose.schema.options.js";

const { ObjectId } = mongoose.Schema.Types;

/**
 * One entry per unsuccessful login attempt — security/monitoring data for
 * spotting brute-force or credential-stuffing patterns. `userId` is only set
 * when `identifier` matched a real account; an attempt against a
 * non-existent account is still logged, with `userId: null`.
 */
const failedLoginLogSchemaDefinition = {
    userId: {
        type: ObjectId,
        ref: "User",
        default: null
    },
    identifier: {
        type: String,
        required: [true, "Identifier is required"],
    },
    reason: {
        type: String,
        default: null,
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

const failedLoginLogSchema = new mongoose.Schema(failedLoginLogSchemaDefinition,
    {
        ...mongooseSchemaOptions,
        timestamps: {createdAt: true, updatedAt: false},
    }
);


// Fast lookup: "all failed attempts for this one user, newest first" —
// useful for spotting a burst of failures against one specific account.
failedLoginLogSchema.index({ userId: 1, createdAt: -1 });

/** TTL index — MongoDB automatically deletes entries ~180 days after createdAt. */
failedLoginLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });


/** The FailedLoginLog Mongoose Model — collection `failedloginlogs`. */
const FailedLoginLog = mongoose.model("FailedLoginLog", failedLoginLogSchema);

export {
    FailedLoginLog
}
