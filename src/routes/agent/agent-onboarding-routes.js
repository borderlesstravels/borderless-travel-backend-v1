const express = require("express");
const {
  validateAgentOnboardingParams,
  validate,
} = require("../../middlewares/validator");
const {
  submitAgentApplication,
} = require("../../controllers/agent/agent-onboarding-controller");

const router = express.Router();

router.post(
  "/apply",
  validateAgentOnboardingParams,
  validate,
  submitAgentApplication
);

module.exports = router;
