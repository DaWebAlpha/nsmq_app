import { User } from "../../models/index.js";
import { generateResetToken, sendPasswordResetEmail } from "../../utils/index.js";
import { config } from "../../config/index.js";

/**
 * Issues a password-reset token if (and only if) a matching, password-based
 * account exists — but never signals that back to the caller. The
 * controller always shows the same "if that email exists..." message
 * either way, so this function intentionally returns nothing to check.
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.baseUrl - Origin used to build the emailed reset link, e.g. "https://app.example.com".
 * @returns {Promise<void>}
 */
const forgotPasswordService = async ({ email, baseUrl } = {}) => {
    // IF no email was given, quietly do nothing — same "always look the
    // same from outside" reasoning as every branch below.
    if (!email) {
        return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail, isDeleted: false }).select("+password");

    // IF no account matches, OR the account has no password (e.g. a future
    // OAuth-only account) — stop here, but DON'T tell the caller which case
    // it was. This is what prevents "email enumeration": an attacker
    // submitting random emails can never learn which ones are registered,
    // because a real account and a fake one produce an identical response.
    if (!user || !user.password) {
        // No account, or an OAuth-only account with no password to reset.
        return;
    }

    // Generate the one-time token: rawToken goes in the email link,
    // tokenHash is the only thing that gets stored.
    const { rawToken, tokenHash } = generateResetToken();

    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpiresAt = new Date(Date.now() + config.passwordResetTokenExpiryMinutes * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    // Send the email (or, in local dev with no SMTP configured, mailer.js
    // just logs this link instead of actually sending it).
    await sendPasswordResetEmail({
        to: user.email,
        resetUrl: `${baseUrl}/reset-password?token=${rawToken}`,
    });
};

export { forgotPasswordService };
