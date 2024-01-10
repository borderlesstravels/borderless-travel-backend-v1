const express = require('express');
const { validateHostSignupParams, validate } = require('../../middlewares/validator');
const {
  validateNewHost,
  isHostPasswordResetTokenValid,
  validateHostLoginType,
} = require('../../middlewares/host');
const {
  signupHost,
  generateHostEmailVerificationToken,
  verifyHostEmail,
  forgotPasswordHost,
  resetPasswordHost,
  loginHost,
} = require('../../controllers/website/host-auth-controller');
const {
  verificationEmail,
  emailVerifiedEmail,
  resetPasswordEmail,
  passwordUpdatedEmail,
  loginSuccessfulEmail,
} = require('../../services/emailServices');

const router = express.Router();

router.post(
  '/signup',
  validateHostSignupParams,
  validate,
  validateNewHost,
  signupHost,
  generateHostEmailVerificationToken,
  verificationEmail
);
router.post('/resend-verification-otp', generateHostEmailVerificationToken, verificationEmail);
router.post('/verify-email', verifyHostEmail, emailVerifiedEmail);
router.post('/forgot-password', forgotPasswordHost, resetPasswordEmail);
router.post(
  '/reset-password',
  isHostPasswordResetTokenValid,
  resetPasswordHost,
  passwordUpdatedEmail
);
router.post('/login', validateHostLoginType, loginHost, loginSuccessfulEmail);

module.exports = router;
