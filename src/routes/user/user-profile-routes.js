const express = require('express');
const {
  getUser,
  getReferralProfile,
  updateUserProfile,
  updateUserPassword,
  withdrawReferralEarning,
  updateUserEmailAlert,
} = require('../../controllers/user/user-profile-controller');
const { verifyUserLoginToken } = require('../../controllers/website/user-auth-controller');
const {
  passwordUpdatedEmail,
  profileUpdatedEmail,
  refEarningWithdrawnEmail,
} = require('../../services/emailServices');
const {
  validate,
  validateUpdateProfileUserParams,
  validateUpdatePasswordParams,
  validateUpdateEmailAlertUserParams,
} = require('../../middlewares/validator');

const router = express.Router();

// Profile
router.get('/user', verifyUserLoginToken, getUser);
router.put(
  '/update-profile',
  verifyUserLoginToken,
  validateUpdateProfileUserParams,
  validate,
  updateUserProfile
);
router.put(
  '/update-password',
  verifyUserLoginToken,
  validateUpdatePasswordParams,
  validate,
  updateUserPassword,
  passwordUpdatedEmail
);
router.put(
  '/update-email-preferences',
  verifyUserLoginToken,
  validateUpdateEmailAlertUserParams,
  validate,
  updateUserEmailAlert
);

module.exports = router;
