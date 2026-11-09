const express = require("express");
const { authLimit } = require("../../middlewares/auth-rate-limit");
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
  authLimit("admin-email-send", req => req.body.userId, 5, 900),
  generateAdminEmailVerificationToken,
  accountVerificationEmail
);

router.post("/verify-email", authLimit("admin-email-verify", req => req.body.userId, 5, 900), verifyEmail, emailVerifiedEmail);
router.post("/forgot-password", authLimit("admin-reset-send", req => req.body.email, 5, 3600), forgotPassword, resetPasswordEmail);
router.post(
  "/reset-password",
  authLimit("admin-reset-verify", req => req.query.id),
  isAdminPasswordResetTokenValid,
  resetPassword,
  passwordUpdatedEmail
);
router.post(
  "/login",
  validateAdminLoginType,
  authLimit("admin-login", req => req.body.existingAdmin?._id),
  loginAdminAttempt,
  generateAdminLoginToken,
  loginVerificationEmail
);

router.post(
  "/resend-login-otp",
  authLimit("admin-otp-send", req => req.body.userId, 5, 900),
  generateAdminLoginToken,
  loginVerificationEmail
);
router.post(
  "/verify-login",
  authLimit("admin-otp-verify", req => req.body.userId, 5, 900),
  verifyLoginAttempt,
  logAdminIn,
  loginSuccessfulEmail
);

router.get("/get-admin", verifyAdminLoginToken, getAdmin);

router.get("/check-session", verifyAdminLoginToken, isAdminLogin);
router.post("/logout", logoutAdmin);

module.exports = router;
