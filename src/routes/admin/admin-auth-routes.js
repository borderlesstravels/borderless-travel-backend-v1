const express = require("express");
const {
  isAdminPasswordResetTokenValid,
  validateAdminLoginType,
} = require("../../middlewares/admin");
const {
  verifyEmail,
  forgotPassword,
  resetPassword,
  isAdminLogin,
  logoutAdmin,
  generateAdminLoginToken,
  verifyLoginAttempt,
  loginAdminAttempt,
  logAdminIn,
  verifyAdminLoginToken,
  getAdmin,
} = require("../../controllers/admin/admin-auth-controller");
const {
  emailVerifiedEmail,
  resetPasswordEmail,
  passwordUpdatedEmail,
  loginVerificationEmail,
  loginSuccessfulEmail,
  accountVerificationEmail,
} = require("../../services/emailServices");
const {
  generateAdminEmailVerificationToken,
} = require("../../controllers/admin/admin-admin-controller");

const router = express.Router();

router.post(
  "/resend-verification-otp",
  generateAdminEmailVerificationToken,
  accountVerificationEmail
);

router.post("/verify-email", verifyEmail, emailVerifiedEmail);
router.post("/forgot-password", forgotPassword, resetPasswordEmail);
router.post(
  "/reset-password",
  isAdminPasswordResetTokenValid,
  resetPassword,
  passwordUpdatedEmail
);
router.post(
  "/login",
  validateAdminLoginType,
  loginAdminAttempt,
  generateAdminLoginToken,
  loginVerificationEmail
);

router.post(
  "/resend-login-otp",
  generateAdminLoginToken,
  loginVerificationEmail
);
router.post(
  "/verify-login",
  verifyLoginAttempt,
  logAdminIn,
  loginSuccessfulEmail
);

router.get("/get-admin", verifyAdminLoginToken, getAdmin);

router.get("/check-session", isAdminLogin);
router.post("/logout", logoutAdmin);

module.exports = router;
