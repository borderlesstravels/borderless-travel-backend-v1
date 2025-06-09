const express = require("express");
const upload = require("../../../multer");

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
  getHostReviews,
  getHostNotifications,
  openNotification,
} = require("../../controllers/host/host-profile-controller");
const {
  validateHostUpdateProfileParams,
  validate,
  validateUpdatePasswordParams,
} = require("../../middlewares/validator");

const router = express.Router();

// Profile
router.get("/profile", verifyHostLoginToken, getHost);
router.get("/reviews", verifyHostLoginToken, getHostReviews);

router.get("/notifications", verifyHostLoginToken, getHostNotifications);
router.put("/open-notification/:id", verifyHostLoginToken, openNotification);
router.put("/update-profile", verifyHostLoginToken, updateHostProfile);
router.put(
  "/update-profile-avatar",
  verifyHostLoginToken,
  upload.array("avatar"),
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

module.exports = router;
