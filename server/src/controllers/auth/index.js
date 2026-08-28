/**
 * Barrel file — re-exports every auth controller from one place.
 */
export { registerUserController } from "./register.controller.js";
export { loginController } from "./login.controller.js";
export { logoutController } from "./logout.controller.js";
export { refreshSessionController } from "./refreshSession.controller.js";
export { forgotPasswordController } from "./forgotPassword.controller.js";
export { resetPasswordController } from "./resetPassword.controller.js";
export { getCurrentUserController } from "./getCurrentUser.controller.js";
export { updateProfileController } from "./updateProfile.controller.js";
export { changePasswordController } from "./changePassword.controller.js";
