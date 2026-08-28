import mongoose from "mongoose";
import { createSchema } from "../base/mongoose.schema.js";

const { ObjectId } = mongoose.Schema.Types;

/**
 * One document per login session. Only the SHA-256 hash of the raw
 * token is ever stored.
 */
const refreshTokenDefinition = {
    userId : {
        type: ObjectId,
        ref: "User",
        required: [true, "User id is required"],
    },
    tokenHash: {
        type: String,
        required: [true, "Token hash is required"],
        unique: true,
    },
    expiresAt: {
        type: Date,
        required: [true, "Expiry is required"],

    },
    revokedAt: {
        type: Date,
        default: null
    },
    userAgent: {
        type: String,
        default: null,
    },
    ipAddress: {
        type: String,
        default: null,
    },
    deviceName: {
        type: String,
        default: null
    },
    deviceId: {
        type: String,
        default: null
    }
}

const refreshTokenSchema = createSchema(refreshTokenDefinition);


// TTL index — MongoDB itself deletes a token once expiresAt passes.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * A token is only active while BOTH conditions hold: it hasn't been
 * revoked (`!this.revokedAt`), AND its expiry is still in the future.
 * @returns {boolean}
 */
refreshTokenSchema.methods.isActive = function () {
    return !this.revokedAt && this.expiresAt.getTime() > Date.now();
};

/**
 * Marks this token dead by stamping `revokedAt` — used on logout, on
 * token rotation, and when killing every other session during a
 * password change/reset.
 */
refreshTokenSchema.methods.revoke = function ({ session = null } = {}) {
    this.revokedAt = new Date();
    return this.save({ session, validateBeforeSave: false });
};

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);

export { RefreshToken }
