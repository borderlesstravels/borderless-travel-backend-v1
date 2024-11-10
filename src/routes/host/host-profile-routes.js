const express = require("express");

const {
  passwordUpdatedEmail,
  profileUpdatedEmail,
} = require("../../services/emailServices");
const {
  verifyHostLoginToken,
} = require("../../controllers/website/host-auth-controller");
const {
  getHost,
  updateHostProfile,
  updateHostPassword,
  logoutHost,
  isHostLogin,
  setHostProfileAvatar,
  addProperty,
  getHostReviews,
  getHostProperties,
  getHostNotifications,
  editProperty,
  approveShortletBooking,
  declineShortletBooking,
} = require("../../controllers/host/host-profile-controller");
const {
  validateHostUpdateProfileParams,
  validate,
  validateUpdatePasswordParams,
  validateAddPropertyParams,
} = require("../../middlewares/validator");
const {
  hostImageUpload,
  shortletImageUpload,
} = require("../../utils/helpers/files");

const router = express.Router();

// Profile
router.get("/profile", verifyHostLoginToken, getHost);
router.get("/reviews", verifyHostLoginToken, getHostReviews);

router.get("/notifications", verifyHostLoginToken, getHostNotifications);
router.put("/update-profile", verifyHostLoginToken, updateHostProfile);
router.put(
  "/update-profile-avatar/:id",
  verifyHostLoginToken,
  hostImageUpload,
  setHostProfileAvatar
);

router.put(
  "/update-password",
  verifyHostLoginToken,
  validateUpdatePasswordParams,
  validate,
  updateHostPassword,
  passwordUpdatedEmail
);

router.get("/check-session", isHostLogin);
router.post("/logout", logoutHost);

// Shortlet
router.post(
  "/add-listing",
  verifyHostLoginToken,
  shortletImageUpload,
  addProperty
);
router.get("/listings", verifyHostLoginToken, getHostProperties);
router.put(
  "/update-listing/:id",
  verifyHostLoginToken,
  shortletImageUpload,
  editProperty
);
router.put(
  "/confirm-booking/:booking_reference",
  verifyHostLoginToken,
  approveShortletBooking
);
router.put(
  "/decline-booking/:booking_reference",
  verifyHostLoginToken,
  declineShortletBooking
);

module.exports = router;
