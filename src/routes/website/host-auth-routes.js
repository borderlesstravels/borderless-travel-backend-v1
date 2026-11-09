const express = require("express");
const { authLimit } = require("../../middlewares/auth-rate-limit");
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
  authLimit("host-email-send", req => req.body.userId, 5, 900),
  generateHostEmailVerificationToken,
  accountVerificationEmail
);
router.post("/verify-email", authLimit("host-email-verify", req => req.body.userId), verifyHostEmail, emailVerifiedEmail);
router.post("/forgot-password", authLimit("host-reset-send", req => req.body.email, 5, 3600), forgotPasswordHost, resetPasswordEmail);
router.post(
  "/reset-password",
  authLimit("host-reset-verify", req => req.query.id),
  isHostPasswordResetTokenValid,
  resetPasswordHost,
  passwordUpdatedEmail
);
router.post("/login", validateHostLoginType, authLimit("host-login", req => req.body.host?._id), loginHost);

module.exports = router;
