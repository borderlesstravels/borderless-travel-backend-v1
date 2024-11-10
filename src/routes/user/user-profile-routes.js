const express = require("express");
const {
  getUser,
  getReferralProfile,
  updateUserProfile,
  updateUserPassword,
  updateUserEmailAlert,
  setUserProfileAvatar,
  userFlightBookings,
  userSingleFlightBooking,
  userShortletBookings,
  userSingleShortletBooking,
  userReviews,
  createReview,
  updateReview,
  deleteReview,
} = require("../../controllers/user/user-profile-controller");
const {
  verifyUserLoginToken,
} = require("../../controllers/website/user-auth-controller");
const {
  passwordUpdatedEmail,
  profileUpdatedEmail,
} = require("../../services/emailServices");
const {
  validate,
  validateUpdateProfileUserParams,
  validateUpdatePasswordParams,
  validateUpdateEmailAlertUserParams,
  validateReviewParams,
} = require("../../middlewares/validator");
const { userImageUpload } = require("../../utils/helpers/files");

const router = express.Router();

// Profile
router.get("/user", verifyUserLoginToken, getUser);
router.put(
  "/update-profile",
  verifyUserLoginToken,
  validateUpdateProfileUserParams,
  validate,
  updateUserProfile
);
router.put(
  "/update-profile-avatar",
  verifyUserLoginToken,
  userImageUpload,
  setUserProfileAvatar
);

router.put(
  "/update-password",
  verifyUserLoginToken,
  validateUpdatePasswordParams,
  validate,
  updateUserPassword,
  passwordUpdatedEmail
);
router.put(
  "/update-email-preferences",
  verifyUserLoginToken,
  validateUpdateEmailAlertUserParams,
  validate,
  updateUserEmailAlert
);

router.get("/flight-bookings", verifyUserLoginToken, userFlightBookings);
router.get(
  "/single-flight-booking/:id",
  verifyUserLoginToken,
  userSingleFlightBooking
);
router.get("/shortlet-bookings", verifyUserLoginToken, userShortletBookings);
router.get(
  "/single-shortlet-booking/:id",
  verifyUserLoginToken,
  userSingleShortletBooking
);
router.get("/reviews", verifyUserLoginToken, userReviews);
router.post(
  "/create-review/:product_reviewed",
  verifyUserLoginToken,
  validateReviewParams,
  validate,
  createReview
);
router.put("/edit-review/:review_id", verifyUserLoginToken, updateReview);
router.delete("/delete-review/:id", verifyUserLoginToken, deleteReview);

module.exports = router;
