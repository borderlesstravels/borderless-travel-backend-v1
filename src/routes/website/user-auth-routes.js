const express = require('express');
const {
  signup,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  generateEmailVerificationToken,
  logout,
  isUserLogin,
} = require('../../controllers/website/user-auth-controller');
const {
  verificationEmail,
  emailVerifiedEmail,
  resetPasswordEmail,
  passwordUpdatedEmail,
  loginSuccessfulEmail,
} = require('../../services/emailServices');
const { validateUserSignupParams, validate } = require('../../middlewares/validator');
const {
  isPasswordResetTokenValid,
  validateNewUser,
  validateLoginType,
} = require('../../middlewares/user');

const router = express.Router();

router.post(
  '/signup',
  validateUserSignupParams,
  validate,
  validateNewUser,
  signup,
  generateEmailVerificationToken,
  verificationEmail
);
router.post('/resend-verification-otp', generateEmailVerificationToken, verificationEmail);
router.post('/verify-email', verifyEmail, emailVerifiedEmail);
router.post('/forgot-password', forgotPassword, resetPasswordEmail);
router.post('/reset-password', isPasswordResetTokenValid, resetPassword, passwordUpdatedEmail);
router.post('/login', validateLoginType, login, loginSuccessfulEmail);
router.get('/check-session', isUserLogin);
router.post('/logout', logout);

module.exports = router;
