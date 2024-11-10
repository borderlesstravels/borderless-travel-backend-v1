const express = require("express");
const {
  verifyAdminLoginToken,
} = require("../../controllers/admin/admin-auth-controller");
const {
  updateUserProfile,
  deleteUser,
  fetchAllUsers,
  fetchSingleUser,
  blockUser,
  unblockUser,
  fetchUserFlightBookings,
  fetchUserShortletBooking,
} = require("../../controllers/admin/admin-user-controller");

const router = express.Router();

router.put(
  "/update-user-profile/:id",
  verifyAdminLoginToken,
  updateUserProfile
);
router.put("/block-user/:id", verifyAdminLoginToken, blockUser);
router.put("/unblock-user/:id", verifyAdminLoginToken, unblockUser);
router.get(
  "/user-flight-bookings/:id",
  verifyAdminLoginToken,
  fetchUserFlightBookings
);
router.get(
  "/user-short-stay-bookings/:id",
  verifyAdminLoginToken,
  fetchUserShortletBooking
);
router.delete("/delete-user/:id", verifyAdminLoginToken, deleteUser);
router.get("/fetch-all-users", verifyAdminLoginToken, fetchAllUsers);
router.get("/fetch-single-user/:id", verifyAdminLoginToken, fetchSingleUser);

module.exports = router;
