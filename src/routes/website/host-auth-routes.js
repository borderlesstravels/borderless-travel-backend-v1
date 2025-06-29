const express = require("express");
const {
  validateHostSignupParams,
  validate,
  validateUserSignupParams,
} = require("../../middlewares/validator");
const {
  validateNewHost,
  isHostPasswordResetTokenValid,
  validateHostLoginType,
} = require("../../middlewares/host");
const {
  signupHost,
  generateHostEmailVerificationToken,
  verifyHostEmail,
  forgotPasswordHost,
  resetPasswordHost,
  loginHost,
} = require("../../controllers/website/host-auth-controller");
const {
  accountVerificationEmail,
  emailVerifiedEmail,
  resetPasswordEmail,
  passwordUpdatedEmail,
  loginSuccessfulEmail,
  successfulSignupEmail,
} = require("../../services/emailServices");

const router = express.Router();

router.post(
  "/signup",
  validateUserSignupParams,
  validate,
  validateNewHost,
  signupHost,
  generateHostEmailVerificationToken,
  successfulSignupEmail,
  accountVerificationEmail
);
router.post(
  "/resend-verification-otp",
  generateHostEmailVerificationToken,
  accountVerificationEmail
);
router.post("/verify-email", verifyHostEmail, emailVerifiedEmail);
router.post("/forgot-password", forgotPasswordHost, resetPasswordEmail);
router.post(
  "/reset-password",
  isHostPasswordResetTokenValid,
  resetPasswordHost,
  passwordUpdatedEmail
);
router.post("/login", validateHostLoginType, loginHost, loginSuccessfulEmail);

module.exports = router;
