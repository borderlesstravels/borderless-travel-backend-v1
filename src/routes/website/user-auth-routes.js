const express = require("express");
const { authLimit } = require("../../middlewares/auth-rate-limit");
const {
  signup,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  generateEmailVerificationToken,
  logout,
  isUserLogin,
  isEmailRegistered,
} = require("../../controllers/website/user-auth-controller");
const {
  accountVerificationEmail,
  emailVerifiedEmail,
  resetPasswordEmail,
  passwordUpdatedEmail,
  loginSuccessfulEmail,
  successfulSignupEmail,
} = require("../../services/emailServices");
const {
  validateUserSignupParams,
  validate,
} = require("../../middlewares/validator");
const {
  isPasswordResetTokenValid,
  validateNewUser,
  validateLoginType,
} = require("../../middlewares/user");

const router = express.Router();

router.post(
  "/signup",
  validateUserSignupParams,
  validate,
  validateNewUser,
  signup,
  generateEmailVerificationToken,
  successfulSignupEmail,
  accountVerificationEmail
);
router.post(
  "/resend-verification-otp",
  authLimit("user-email-send", req => req.body.userId, 5, 900),
  generateEmailVerificationToken,
  accountVerificationEmail
);
router.post("/verify-email", authLimit("user-email-verify", req => req.body.userId), verifyEmail, emailVerifiedEmail);
router.post("/forgot-password", authLimit("user-reset-send", req => req.body.email, 5, 3600), forgotPassword, resetPasswordEmail);
router.post(
  "/reset-password",
  authLimit("user-reset-verify", req => req.query.id, 10, 900),
  isPasswordResetTokenValid,
  resetPassword,
  passwordUpdatedEmail
);
router.post("/login", validateLoginType, authLimit("user-login", req => req.body.user?._id), login);
router.get("/check-session", isUserLogin);
router.post("/logout", logout);
router.post("/check-email", isEmailRegistered);

module.exports = router;
