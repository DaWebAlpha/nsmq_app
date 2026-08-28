import argon2 from "argon2";
import { systemLogger } from "../logger/pino.logger.js";
import {
    BadRequestError,
    InternalServerError
} from "../errors/index.js";


/**
 * Argon2id hashing parameters used by {@link hashPassword}.
 */
const ARGON_CONFIG = {
    /**
     * Argon2id — the variant OWASP recommends, hybrid-resistant to
     * both GPU-cracking and side-channel attacks.
     */
    type: argon2.argon2id,
    /**
     * Memory cost in KiB (2**16 = 65536 KiB = 64 MiB) — the main
     * lever against GPU/ASIC brute-forcing.
     */
    memoryCost: 2 ** 16,
    /**
     * Number of hashing iterations.
     */
    timeCost: 3,
    /**
     * Number of threads used to compute the hash in parallel.
     */
    parallelism: 2,
    /**
     * Output hash length in bytes.
     */
    hashLength: 32,
};


/**
 * Validates and hashes a plaintext password with Argon2id.
 * @param {string} password - The plaintext password to hash.
 * @returns {Promise<string>} The Argon2 hash string.
 * @throws {BadRequestError} If `password` isn't a string, is empty, or is under 8 characters.
 * @throws {InternalServerError} If Argon2 itself fails to hash (logged first, original error not leaked).
 */
const hashPassword = async(password) => {
    // Three input checks, in order, each with its OWN specific error code
    // (not just one generic "invalid password" message) — a client/form
    // can tell exactly which rule was violated.
    if(typeof password !== "string"){
        throw new BadRequestError({
            message: "Password must be a string",
            code: "PASSWORD_NOT_STRING"
        });
    };

    if(password.length === 0){
        throw new BadRequestError({
            message: "Password is required",
            code: "PASSWORD_REQUIRED"
        })
    };

    if(password.length < 8){
        throw new BadRequestError({
            message: "Password must be at least 8 characters long",
            code: "PASSWORD_LESS_THAN_8_CHARACTERS"
        })
    }

    // Do the actual (relatively slow, by design) Argon2id hash.
    try{

        return await argon2.hash(password, ARGON_CONFIG);
    }catch(error){
        // IF Argon2 itself fails (extremely rare — a real system-level
        // problem, not bad input), log the real error internally but
        // throw a GENERIC message to the caller — never leak raw
        // hashing-library internals to a client.
        systemLogger.error(
            {err: error},
            "Security: Password hashing failed",
        );

        throw new InternalServerError({
            message: "Internal security error",
            code: "INTERNAL_SECURITY_ERROR",
        })
    }
}

/**
 * Verifies a plaintext password against an Argon2 hash. Returns `false`
 * instead of throwing for malformed input or a verification failure —
 * only a genuinely unexpected Argon2 error gets logged; a normal
 * "wrong password" is not an error, just a `false` result.
 * @param {string} plainPassword - The plaintext password to check.
 * @param {string} hashedPassword - The stored Argon2 hash to check against.
 * @returns {Promise<boolean>} True if `plainPassword` matches `hashedPassword`.
 */
const verifyPassword = async(plainPassword, hashedPassword) => {
    // IF either input is malformed, just return false — a malformed
    // comparison should look EXACTLY like "wrong password" to the caller,
    // never throw a different kind of error a client could distinguish.
    if(
        typeof plainPassword !== "string" ||
        typeof hashedPassword !== "string" ||
        plainPassword.length === 0 ||
        hashedPassword.length === 0
    ){
        return false;
    }

    try{
        // argon2.verify returns true/false — this IS the actual comparison.
        return await argon2.verify(hashedPassword, plainPassword)
    }catch(error){
        // A genuinely unexpected Argon2 error (corrupt hash, etc.) — log it,
        // but STILL fall through to `return false` below rather than
        // throwing. A normal "wrong password" and a rare internal error
        // both end up looking the same to the caller: "didn't match."
        systemLogger.error(
            {err: error},
            "Security: Password verification failed"
        )
    }
    return false;
}

export {
    hashPassword,
    verifyPassword
}
