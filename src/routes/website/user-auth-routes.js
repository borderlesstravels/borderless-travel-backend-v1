const express = require("express");
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
  generateEmailVerificationToken,
  accountVerificationEmail
);
router.post("/verify-email", verifyEmail, emailVerifiedEmail);
router.post("/forgot-password", forgotPassword, resetPasswordEmail);
router.post(
  "/reset-password",
  isPasswordResetTokenValid,
  resetPassword,
  passwordUpdatedEmail
);
router.post("/login", validateLoginType, login);
router.get("/check-session", isUserLogin);
router.post("/logout", logout);
router.post("/check-email", isEmailRegistered);

module.exports = router;
