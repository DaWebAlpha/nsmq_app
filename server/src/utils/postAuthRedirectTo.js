import {USER_ROLES } from "../constants/index.js";

/**
 * Where to send a browser client immediately after a successful
 * login/registration, based on the user's role. Used by `responseAction`
 * (see responseAction.js) for the non-JSON (redirect) response path.
 * NOTE: the actual `/admin/dashboard` and `/dashboard` routes referenced
 * here don't exist yet in this app (only auth services/controllers are
 * built so far) — this is forward-looking scaffolding for once they are.
 * @param {{role?: string}|null|undefined} user
 * @returns {string} The path to redirect to.
 */
const getPostAuthRedirect = (user) => {
    if (user?.role === USER_ROLES.SUPERADMIN) {
        return "/superadmin/dashboard";
    }else if(user?.role === USER_ROLES.ADMIN){
        return "/admin/dashboard"
    }

    return "/dashboard";
};

export { getPostAuthRedirect };
