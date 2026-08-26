import mongoose from "mongoose";
import { createSchema } from "../base/mongoose.schema.js";
import { SECURITY_CONFIG } from "../../constants/index.js";

const { ObjectId } = mongoose.Schema.Types;

/**
 * Login-attempt, ban, and suspension state — one document per User, kept
 * separate from the User model (unique `userId`) so high-frequency
 * failed-login writes never collide with profile edits. Ban is indefinite
 * until an admin action reverses it; suspend is self-expiring via
 * `suspendedUntil`.
 */
const userSecuritySchemaDefinition = {
    userId: {
        type: ObjectId,
        ref: "User",
        required: [true, "User id is required"],
        unique: true,
    },
    failedLoginAttempts: {
        type: Number,
        default: 0,
    },
    lastFailedLoginAt: {
        type: Date,
        default: null,
    },
    lockedUntil: {
        type: Date,
        default: null
    },
    lastLoginAt: {
        type: Date,
        default: null,
    },
    lastLoginIp: {
        type: String,
        default: null,
    },
    isBanned: {
        type: Boolean,
        default: false,
    },
    bannedAt: {
        type: Date,
        default: null,
    },
    bannedBy: {
        type: ObjectId,
        ref: "User",
        default: null,
    },
    banReason: {
        type: String,
        default: null,
    },
    unbannedAt: {
        type: Date,
        default: null,
    },
    unbannedBy: {
        type: ObjectId,
        ref: "User",
        default: null,
    },
    suspendedUntil: {
        type: Date,
        default: null,
    },
    suspendedBy: {
        type: ObjectId,
        ref: "User",
        default: null,
    },
    suspendReason: {
        type: String,
        default: null,
    },
    unsuspendedAt: {
        type: Date,
        default: null,
    },
    unsuspendedBy: {
        type: ObjectId,
        ref: "User",
        default: null,
    },
}

const userSecuritySchema = createSchema(userSecuritySchemaDefinition);


/** @returns {boolean} True while `lockedUntil` is set and still in the future. */
userSecuritySchema.methods.isLocked = function () {
    return Boolean(this.lockedUntil) && this.lockedUntil.getTime() > Date.now();
};

/** @returns {boolean} True while `suspendedUntil` is set and still in the future. */
userSecuritySchema.methods.isSuspended = function () {
    return Boolean(this.suspendedUntil) && this.suspendedUntil.getTime() > Date.now();
};

/** Increments the failed-attempt counter and locks the account once it reaches SECURITY_CONFIG.MAX_FAILED_LOGIN_ATTEMPTS. */
userSecuritySchema.methods.registerFailedAttempt = function({session = null} = {}){
    // Bump the counter and timestamp every time this is called.
    this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
    this.lastFailedLoginAt = new Date();

    // IF the counter just crossed the configured threshold, lock the
    // account for SECURITY_CONFIG.LOCKOUT_DURATION_MINUTES from right now.
    if(this.failedLoginAttempts >= SECURITY_CONFIG.MAX_FAILED_LOGIN_ATTEMPTS){
        this.lockedUntil = new Date(
            Date.now() + SECURITY_CONFIG.LOCKOUT_DURATION_MINUTES * 60 * 1000
        );

    }

    return this.save({session, validateBeforeSave: false});
}


/** Resets failed-attempt count and lockout, records the login time/IP. */
userSecuritySchema.methods.registerSuccessfulLogin = function({ipAddress = null, session = null} = {}){
    this.failedLoginAttempts = 0;
    this.lastLoginAt = new Date();
    this.lockedUntil = null;
    this.lastLoginIp = ipAddress;

    return this.save({session, validateBeforeSave: false});
}

// The four methods below (ban/unban/suspend/unsuspend) all follow the same
// shape: set the new state's fields, clear the OPPOSITE state's fields
// (banning clears any old unban info, and vice versa), then save.
userSecuritySchema.methods.ban = function ({ bannedByUserId = null, reason = null, session = null } = {}) {
    this.isBanned = true;
    this.bannedAt = new Date();
    this.bannedBy = bannedByUserId;
    this.banReason = reason;
    this.unbannedAt = null;
    this.unbannedBy = null;

    return this.save({ session, validateBeforeSave: false });
};

userSecuritySchema.methods.unban = function ({ unbannedByUserId = null, reason = null, session = null } = {}) {
    this.isBanned = false;
    this.bannedAt = null;
    this.bannedBy = null;
    this.banReason = null;
    this.unbannedAt = new Date();
    this.unbannedBy = unbannedByUserId;

    return this.save({ session, validateBeforeSave: false });
};

userSecuritySchema.methods.suspend = function ({ suspendedByUserId = null, reason = null, until, session = null } = {}) {
    this.suspendedUntil = until;
    this.suspendedBy = suspendedByUserId;
    this.suspendReason = reason;
    this.unsuspendedAt = null;
    this.unsuspendedBy = null;

    return this.save({ session, validateBeforeSave: false });
};

userSecuritySchema.methods.unsuspend = function ({ unsuspendedByUserId = null, reason = null, session = null } = {}) {
    this.suspendedUntil = null;
    this.suspendedBy = null;
    this.suspendReason = null;
    this.unsuspendedAt = new Date();
    this.unsuspendedBy = unsuspendedByUserId;

    return this.save({ session, validateBeforeSave: false });
};


/**
 * Fetches the UserSecurity document for `userId`, creating one with default
 * values if it doesn't exist yet (e.g. the first time a brand-new user logs in).
 * @param {import("mongoose").Types.ObjectId | string} userId
 * @returns {Promise<import("mongoose").Document>}
 */
userSecuritySchema.statics.findOrCreateForUser = async function (userId, { session = null } = {}) {
    // STEP 1: Look for an existing record first.
    let query = this.findOne({ userId });

    if (session) {
        query = query.session(session);
    }

    const existing = await query;

    // IF found, just return it — no write needed.
    if (existing) {
        return existing;
    }

    // ELSE, this user has never triggered a security record before —
    // create one now with all-default values (0 failed attempts, not
    // banned/suspended/locked).
    const [created] = await this.create(
        [{ userId }],
        session ? { session } : undefined,
    );

    return created;
};

/** The UserSecurity Mongoose Model — collection `usersecurities`. */
const UserSecurity = mongoose.model("UserSecurity", userSecuritySchema);

export { UserSecurity };
