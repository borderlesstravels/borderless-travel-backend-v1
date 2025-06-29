const express = require("express");
const { validateAdmin, validate } = require("../../middlewares/validator");
const { validateNewAdmin } = require("../../middlewares/admin");

const { accountVerificationEmail } = require("../../services/emailServices");
const {
  addAdmin,
  generateAdminEmailVerificationToken,
  updateAdminProfile,
  deleteAdmin,
  fetchAllAdmins,
  fetchSingleAdmin,
  addAdminRole,
  updateAdminRole,
  deleteAdminRole,
  fetchAdminRoles,
  fetchSingleAdminRole,
  setProfileAvatar,
} = require("../../controllers/admin/admin-admin-controller");
const {
  verifyAdminLoginToken,
} = require("../../controllers/admin/admin-auth-controller");
const { adminImageUpload } = require("../../utils/helpers/files");

const router = express.Router();

router.post(
  "/add-admin",
  verifyAdminLoginToken,
  validateAdmin,
  validate,
  validateNewAdmin,
  addAdmin,
  generateAdminEmailVerificationToken,
  accountVerificationEmail
);
router.post(
  "/resend-verification-otp",
  generateAdminEmailVerificationToken,
  accountVerificationEmail
);
router.put(
  "/update-admin-profile/:id",
  verifyAdminLoginToken,
  updateAdminProfile
);
router.put(
  "/update-profile-avatar/:id",
  verifyAdminLoginToken,
  adminImageUpload,
  setProfileAvatar
);
router.delete("/delete-admin/:id", verifyAdminLoginToken, deleteAdmin);
router.get("/fetch-all-admins", verifyAdminLoginToken, fetchAllAdmins);
router.get("/fetch-single-admin/:id", verifyAdminLoginToken, fetchSingleAdmin);

// Admin roles
router.post("/add-admin-role", verifyAdminLoginToken, addAdminRole);
router.put("/update-admin-role/:id", verifyAdminLoginToken, updateAdminRole);
router.delete("/delete-admin-role/:id", verifyAdminLoginToken, deleteAdminRole);
router.get("/fetch-admin-roles", verifyAdminLoginToken, fetchAdminRoles);
router.get(
  "/fetch-admin-role/:id",
  verifyAdminLoginToken,
  fetchSingleAdminRole
);

module.exports = router;
