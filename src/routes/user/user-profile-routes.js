const express = require('express');
const {
  getUser,
  getReferralProfile,
  updateUserProfile,
  updateUserPassword,
  updateUserEmailAlert,
  setUserProfileAvatar,
  userFlightBookings,
  userSingleFlightBooking,
} = require('../../controllers/user/user-profile-controller');
const { verifyUserLoginToken } = require('../../controllers/website/user-auth-controller');
const { passwordUpdatedEmail, profileUpdatedEmail } = require('../../services/emailServices');
const {
  validate,
  validateUpdateProfileUserParams,
  validateUpdatePasswordParams,
  validateUpdateEmailAlertUserParams,
} = require('../../middlewares/validator');
const { userImageUpload } = require('../../utils/helpers/files');

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
router.put('/update-profile-avatar', verifyUserLoginToken, userImageUpload, setUserProfileAvatar);

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

router.get('/flight-bookings', verifyUserLoginToken, userFlightBookings);
router.get('/single-flight-booking/:id', verifyUserLoginToken, userSingleFlightBooking);

module.exports = router;
