import { config } from "../config/index.js";

const isProduction = config.nodeEnv === "production";
const ACCESS_TOKEN_COOKIE = config.accessTokenCookie;
const REFRESH_TOKEN_COOKIE = config.refreshTokenCookie;


/**
 * Sets the access and refresh tokens as httpOnly cookies, each with its
 * own maxAge matching the token's actual lifetime. `secure` follows
 * config.nodeEnv, not a hardcoded flag, so cookies work over plain HTTP in
 * development but are HTTPS-only in production.
 * @param {import("express").Response} response
 * @param {object} tokens
 * @param {string} tokens.accessToken
 * @param {string} tokens.refreshToken
 * @returns {void}
 */
const setAuthCookies = (response, {accessToken, refreshToken}) => {
    response.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: config.jwtAccessExpirySeconds * 1000,
    });

    response.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        // config only stores the refresh expiry in DAYS (see config/index.js
        // and generateRefreshToken in refreshTokenUtils.js, which computes
        // its own expiresAt the same way) — convert to milliseconds here,
        // which is what response.cookie's maxAge expects.
        maxAge: config.jwtRefreshExpiryDays * 24 * 60 * 60 * 1000,
    });
}

/**
 * Clears both auth cookies, e.g. on logout.
 * @param {import("express").Response} response
 * @returns {void}
 */
const clearAuthCookies = (response) => {
    response.clearCookie(ACCESS_TOKEN_COOKIE);
    response.clearCookie(REFRESH_TOKEN_COOKIE);
};

export {
    setAuthCookies,
    clearAuthCookies,
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE
};
