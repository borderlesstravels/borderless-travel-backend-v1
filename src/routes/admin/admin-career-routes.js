const express = require("express");
const {
  verifyAdminLoginToken,
} = require("../../controllers/admin/admin-auth-controller");
const { validateAddJob } = require("../../middlewares/validator");
const {
  addNewJob,
  editJobOffer,
  deleteJobOffer,
  fetchJobPostApplications,
  deleteJobApplication,
  fetchAllJobApplications,
} = require("../../controllers/admin/admin-career-controller");
const { jobPostAppDocUpload } = require("../../utils/helpers/files");

const router = express.Router();

router.post(
  "/add-new-job",
  verifyAdminLoginToken,
  jobPostAppDocUpload,
  addNewJob
);
router.put("/edit-job-offer/:id", verifyAdminLoginToken, editJobOffer);
router.delete("/delete-job-offer/:id", verifyAdminLoginToken, deleteJobOffer);

router.get(
  "/all-job-offer-applications/",
  verifyAdminLoginToken,
  fetchAllJobApplications
);
router.get(
  "/job-offer-applications/:id",
  verifyAdminLoginToken,
  fetchJobPostApplications
);
router.delete(
  "/delete-job-offer-application/:id",
  verifyAdminLoginToken,
  deleteJobApplication
);

module.exports = router;
