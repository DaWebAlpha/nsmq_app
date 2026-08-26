import { verifyRefreshToken } from "../../utils/refreshTokenUtils.js";

/**
 * Ends a session by revoking its refresh token. Deliberately silent on
 * every "nothing to do" case (no token supplied, or the token is already
 * invalid/expired/revoked) rather than throwing — a logout should always
 * appear to succeed from the client's point of view, whether or not there
 * was an active session to actually end.
 * @param {object} [params]
 * @param {string} [params.rawRefreshToken] - The raw refresh token from the client's cookie.
 * @returns {Promise<void>}
 */
const logoutService = async({rawRefreshToken} = {}) => {
    // IF no token was given, there is nothing to revoke — just return.
    // No error is thrown: from the client's side, "already logged out" and
    // "just logged out" should look identical.
    if(!rawRefreshToken){
        return;
    }

    // Look up the token and confirm it's still active (not already
    // revoked/expired). verifyRefreshToken returns null instead of throwing
    // if it isn't — see refreshTokenUtils.js.
    const token = await verifyRefreshToken(rawRefreshToken);

    // IF a real, active token was found, revoke it now.
    // IF NOT (already dead/unknown token), do nothing — same reasoning as above.
    if(token){
        await token.revoke();
    }
}

export { logoutService };
