import { User, RefreshToken } from "../../models/index.js";
import { hashResetToken, withTransaction } from "../../utils/index.js";
import { recordAuditLog } from "../audit/index.js";
import { BadRequestError } from "../../errors/index.js";

/**
 * Consumes a password-reset token: sets the new password (re-hashed by
 * user.model.js's own pre-save hook) and revokes every active refresh
 * token — a leaked old password shouldn't leave existing sessions usable
 * after it's been changed. Logs "user.password_reset" at "warning" severity.
 * @param {object} params
 * @param {string} params.token - The raw reset token from the emailed link.
 * @param {string} params.newPassword
 * @param {object} [params.requestContext] - Result of `getAuditRequestContext(request)`, spread into the audit entry.
 * @returns {Promise<import("mongoose").Document>} The updated user.
 * @throws {BadRequestError} If `token`/`newPassword` is missing, or the token is invalid/expired.
 */
const resetPasswordService = async ({ token, newPassword, requestContext = {} } = {}) => {
    // GUARD: both fields are required.
    if (!token) throw new BadRequestError({ message: "Reset token is required", code: "RESET_TOKEN_REQUIRED" });
    if (!newPassword) throw new BadRequestError({ message: "New password is required", code: "NEW_PASSWORD_REQUIRED" });

    // Re-hash the raw token from the emailed link, to compare against the
    // stored hash — the raw value itself was never saved anywhere.
    const tokenHash = hashResetToken(token);

    // ONE query does both checks at once: the hash must match AND the
    // token must not be expired yet. An expired token simply matches no
    // document — there's no separate "is it expired" check afterward, so
    // the error below can't reveal WHICH of the two problems it was.
    const user = await User.findOne({
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { $gt: new Date() },
    });

    if (!user) {
        throw new BadRequestError({ message: "Reset link is invalid or has expired", code: "RESET_TOKEN_INVALID" });
    }

    // Everything below happens in one transaction: the password change, the
    // "revoke every session" cleanup, and the audit entry all commit together.
    return withTransaction(async (session) => {
        // STEP 1: Set the new password (auto-hashed by user.model.js's
        // pre("save") hook) and clear the token so it can't be reused.
        user.password = newPassword;
        user.passwordResetTokenHash = null;
        user.passwordResetExpiresAt = null;
        await user.save({ session });

        // STEP 2: Revoke EVERY active session for this user, no exceptions.
        // Unlike changePassword.service.js, there's no "spare the current
        // session" logic here — a password reset means "I don't trust any
        // existing session," so all of them are killed.
        await RefreshToken.updateMany(
            { userId: user._id, revokedAt: null },
            { $set: { revokedAt: new Date() } },
        ).session(session);

        // STEP 3: Record this as a security-relevant event.
        await recordAuditLog({
            entityType: "User",
            entityId: user._id,
            action: "user.password_reset",
            performedBy: user._id,
            severity: "warning",
            session,
            ...requestContext,
        });

        return user;
    });
};

export { resetPasswordService };
