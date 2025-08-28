const express = require("express");
const {
  verifyAdminLoginToken,
} = require("../../controllers/admin/admin-auth-controller");
const {
  updateHostProfile,
  deleteHost,
  fetchAllHosts,
  fetchSingleHost,
  blockHost,
  unblockHost,
  getHostProperties,
  getHostReviewsForAProperty,
  getHostBookingsForAProperty,
  getWithdrawalRequests,
  rejectWithdrawalRequest,
} = require("../../controllers/admin/admin-host-controller");

const router = express.Router();

router.put(
  "/update-host-profile/:id",
  verifyAdminLoginToken,
  updateHostProfile
);
router.put("/block-host/:id", verifyAdminLoginToken, blockHost);
router.put("/unblock-host/:id", verifyAdminLoginToken, unblockHost);
router.delete("/delete-host/:id", verifyAdminLoginToken, deleteHost);
router.get("/fetch-all-hosts", verifyAdminLoginToken, fetchAllHosts);
router.get("/fetch-single-host/:id", verifyAdminLoginToken, fetchSingleHost);
router.get(
  "/fetch-host-properties/:id",
  verifyAdminLoginToken,
  getHostProperties
);
router.get(
  "/fetch-property-reviews/:id",
  verifyAdminLoginToken,
  getHostReviewsForAProperty
);
router.get(
  "/fetch-property-bookings/:id",
  verifyAdminLoginToken,
  getHostBookingsForAProperty
);

router.get(
  "/fetch-withdrawal-requests",
  verifyAdminLoginToken,
  getWithdrawalRequests
);
router.put(
  "/reject-withdrawal-request/:id",
  verifyAdminLoginToken,
  rejectWithdrawalRequest
);

module.exports = router;
