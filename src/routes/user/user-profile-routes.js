const express = require('express');
const {
  getUser,
  getReferralProfile,
  updateUserProfile,
  updateUserPassword,
  withdrawReferralEarning,
} = require('../../controllers/user/user-profile-controller');
const { verifyUserLoginToken } = require('../../controllers/website/user-auth-controller');
const {
  passwordUpdatedEmail,
  profileUpdatedEmail,
  refEarningWithdrawnEmail,
} = require('../../services/emailServices');

const router = express.Router();

// Profile
router.get('/user', verifyUserLoginToken, getUser);
router.put('/update-profile', verifyUserLoginToken, updateUserProfile, profileUpdatedEmail);
router.put('/update-password', verifyUserLoginToken, updateUserPassword, passwordUpdatedEmail);

// Referrals
router.get('/referrals', verifyUserLoginToken, getReferralProfile);
router.post(
  '/withdraw-referral-earning',
  verifyUserLoginToken,
  withdrawReferralEarning,
  refEarningWithdrawnEmail
);

module.exports = router;
