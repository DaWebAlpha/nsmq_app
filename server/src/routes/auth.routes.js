import express from "express";

import {
    registerUserController,
    loginController,
    logoutController,
    refreshSessionController,
    forgotPasswordController,
    resetPasswordController,
    getCurrentUserController,
    updateProfileController,
    changePasswordController,
} from "../controllers/index.js";
import { authenticate } from "../middlewares/index.js";

/**
 * Auth routes: register/login/logout/refresh/forgot-password/reset-password
 * (public), plus the logged-in user's own profile/password-change routes
 * (protected by `authenticate`). Mounted at /auth in app.js.
 */
const authRouter = express.Router();

authRouter.post("/register", registerUserController);
authRouter.post("/login", loginController);
authRouter.post("/logout", logoutController);
authRouter.post("/refresh", refreshSessionController);
authRouter.post("/forgot-password", forgotPasswordController);
authRouter.post("/reset-password", resetPasswordController);

authRouter.get("/me", authenticate, getCurrentUserController);
authRouter.post("/me/update", authenticate, updateProfileController);
authRouter.post("/change-password", authenticate, changePasswordController);

export { authRouter };
