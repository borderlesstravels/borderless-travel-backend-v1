const express = require("express");
const {
  contactUsEmail,
  waitlistSubscribedEMail,
} = require("../../services/emailServices");
const {
  validateContactUsParams,
  validateSubscriptionParams,
  validate,
  validatePaymentRecord,
} = require("../../middlewares/validator");
const {
  saveSubscriber,
  applyForJob,
  fetchJobPostings,
  fetchSingleJobPosting,
  services,
  payForFlight,
  payForShortlet,
  saveWaitlist,
  fetchWaitlists,
  fetchAllHelpArticles,
  fetchHelpArticlesByCategory,
  fetchSinglePostBySlug,
  fetchAllBlogs,
  fetchPostCategories,
} = require("../../controllers/website/general-controller");
const { careerAppDocUpload } = require("../../utils/helpers/files");
const {
  verifyUserLoginToken,
} = require("../../controllers/website/user-auth-controller");

const router = express.Router();

router.get("/services", services);
router.post(
  "/record-payment",
  verifyUserLoginToken,
  validatePaymentRecord,
  validate,
  payForFlight
);
router.post(
  "/record-shortlet-payment",
  verifyUserLoginToken,
  validatePaymentRecord,
  validate,
  payForShortlet
);
router.post("/contact-us", validateContactUsParams, validate, contactUsEmail);
router.post("/subscribe", validateSubscriptionParams, validate, saveSubscriber);

router.post(
  "/waitlist",
  validateSubscriptionParams,
  validate,
  saveWaitlist,
  waitlistSubscribedEMail
);
router.get("/fetch-waitlists", fetchWaitlists);

router.get("/jobs", fetchJobPostings);
router.get("/single-job/:id", fetchSingleJobPosting);
router.post("/apply-for-job/:id", careerAppDocUpload, applyForJob);

router.get("/post-categories", fetchPostCategories);
router.get("/all-help-articles", fetchAllHelpArticles);
router.get("/all-blogs", fetchAllBlogs);
router.get("/help-articles-category/:category", fetchHelpArticlesByCategory);
router.get("/single-post/:slug", fetchSinglePostBySlug);

module.exports = router;
