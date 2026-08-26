import crypto from "node:crypto";

/**
 * SHA-256 hashes a raw password-reset token for storage/lookup — mirrors
 * refreshTokenUtils' hashToken, so a database leak alone can never be
 * replayed as a valid reset link; only the hash is ever persisted.
 * @param {string} rawToken
 * @returns {string} Hex-encoded SHA-256 hash.
 */
const hashResetToken = (rawToken) => {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
};

/**
 * Generates a fresh raw password-reset token and its hash. The raw value
 * is only ever returned here, to be embedded in the emailed reset link;
 * only the hash is stored on the user document.
 * @returns {{ rawToken: string, tokenHash: string }}
 */
const generateResetToken = () => {
    // The RAW token — this is what goes in the emailed link.
    const rawToken = crypto.randomBytes(32).toString("hex");
    // Only the HASH gets returned alongside it, for the caller to store —
    // the raw value is never persisted anywhere.
    return { rawToken, tokenHash: hashResetToken(rawToken) };
};

export { hashResetToken, generateResetToken };
