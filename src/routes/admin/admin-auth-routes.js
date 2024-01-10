const express = require('express');
const {
  isAdminPasswordResetTokenValid,
  validateAdminLoginType,
} = require('../../middlewares/admin');
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
} = require('../../controllers/admin/admin-auth-controller');
const {
  emailVerifiedEmail,
  resetPasswordEmail,
  passwordUpdatedEmail,
  loginVerificationEmail,
  loginSuccessfulEmail,
} = require('../../services/emailServices');

const router = express.Router();

router.post('/verify-email', verifyEmail, emailVerifiedEmail);
router.post('/forgot-password', forgotPassword, resetPasswordEmail);
router.post('/reset-password', isAdminPasswordResetTokenValid, resetPassword, passwordUpdatedEmail);
router.post(
  '/login',
  validateAdminLoginType,
  loginAdminAttempt,
  generateAdminLoginToken,
  loginVerificationEmail
);

router.post('/resend-login-otp', generateAdminLoginToken, loginVerificationEmail);
router.post('/verify-login', verifyLoginAttempt, logAdminIn, loginSuccessfulEmail);
router.get('/check-session', isAdminLogin);
router.post('/logout', logoutAdmin);

module.exports = router;
