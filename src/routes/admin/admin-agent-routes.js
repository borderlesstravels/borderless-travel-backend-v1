const express = require("express");
const {
  verifyAdminLoginToken,
} = require("../../controllers/admin/admin-auth-controller");
const {
  validateAgentApplicationStatusParams,
  validateAddAgentCommissionParams,
  validateAddManualAgentCommissionParams,
  validate,
} = require("../../middlewares/validator");
const {
  fetchAllAgentApplications,
  searchApprovedAgents,
  fetchAgentApplicationById,
  fetchAgentEarnings,
  fetchAgentWithdrawals,
  updateAgentApplicationStatus,
  deleteAgentApplication,
  checkFlightAgentCommission,
  addFlightAgentCommission,
  addManualAgentCommission,
} = require("../../controllers/admin/admin-agent-controller");

const router = express.Router();

router.get("/applications", verifyAdminLoginToken, fetchAllAgentApplications);
router.get("/agents/search", verifyAdminLoginToken, searchApprovedAgents);
router.get(
  "/applications/:id",
  verifyAdminLoginToken,
  fetchAgentApplicationById
);
router.get(
  "/applications/:id/earnings",
  verifyAdminLoginToken,
  fetchAgentEarnings
);
router.get(
  "/applications/:id/withdrawals",
  verifyAdminLoginToken,
  fetchAgentWithdrawals
);
router.put(
  "/applications/:id/status",
  verifyAdminLoginToken,
  validateAgentApplicationStatusParams,
  validate,
  updateAgentApplicationStatus
);
router.delete(
  "/applications/:id",
  verifyAdminLoginToken,
  deleteAgentApplication
);
router.post(
  "/flight-commission",
  verifyAdminLoginToken,
  validateAddAgentCommissionParams,
  validate,
  addFlightAgentCommission
);
router.post(
  "/manual-commission",
  verifyAdminLoginToken,
  validateAddManualAgentCommissionParams,
  validate,
  addManualAgentCommission
);
router.get(
  "/flight-commission/:booking_reference",
  verifyAdminLoginToken,
  checkFlightAgentCommission
);

module.exports = router;
