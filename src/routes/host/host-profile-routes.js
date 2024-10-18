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
  "/add-property",
  verifyHostLoginToken,
  shortletImageUpload,
  addProperty
);
router.get("/properties", verifyHostLoginToken, getHostProperties);
router.put(
  "/update-property/:id",
  verifyHostLoginToken,
  shortletImageUpload,
  editProperty
);

module.exports = router;
