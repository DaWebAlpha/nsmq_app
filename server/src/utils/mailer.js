import nodemailer from "nodemailer";
import { config } from "../config/index.js";
import { systemLogger } from "../logger/pino.logger.js";

// This whole dev/prod switch hinges on one check, computed ONCE when this
// module first loads (not on every email sent).
const isConfigured = Boolean(config.mailHost && config.mailUser && config.mailPass);

// IF real SMTP credentials are present in .env, build a real transporter.
// IF NOT (the default in this repo's committed .env), `transporter` stays
// null, and sendPasswordResetEmail below falls back to just logging.
const transporter = isConfigured
    ? nodemailer.createTransport({
        host: config.mailHost,
        port: config.mailPort,
        secure: config.mailSecure,
        auth: {
            user: config.mailUser,
            pass: config.mailPass,
        },
    })
    : null;

/**
 * Sends the password-reset email. When no SMTP credentials are configured,
 * logs the reset link instead of emailing it, so local development works
 * without a real mail provider wired up — swap in real SMTP env vars to
 * start actually sending mail, no code change needed.
 * @param {object} params
 * @param {string} params.to
 * @param {string} params.resetUrl
 * @returns {Promise<void>}
 */
const sendPasswordResetEmail = async ({ to, resetUrl }) => {
    // IF there's no real transporter (SMTP not configured), log the link
    // instead of trying to send it — this is what makes "forgot password"
    // testable locally with zero mail-provider setup.
    if (!transporter) {
        systemLogger.warn(
            { to, resetUrl },
            "SMTP not configured — logging password reset link instead of emailing it",
        );
        return;
    }

    // Send both a plain-text AND an HTML version — different email clients
    // prefer different formats, so providing both is the safe default.
    await transporter.sendMail({
        from: config.mailFrom,
        to,
        subject: "Reset your password",
        text: `Reset your password: ${resetUrl}\nThis link expires in ${config.passwordResetTokenExpiryMinutes} minutes.`,
        html: `<p>Click below to reset your password. This link expires in ${config.passwordResetTokenExpiryMinutes} minutes.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });
};

export { sendPasswordResetEmail };
