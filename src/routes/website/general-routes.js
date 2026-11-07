const express = require("express");
const {
  contactUsEmail,
  waitlistSubscribedEMail,
  flightBookingPaymentReceivedEmail,
  shortletBookingPaymentReceivedEmail,
  shortletBookingCompletedEmail,
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
  saveWaitlist,
  fetchWaitlists,
  fetchAllHelpArticles,
  fetchHelpArticlesByCategory,
  fetchSinglePostBySlug,
  fetchAllBlogs,
  fetchPostCategories,
  fetchLatestTravelInfo,
  fetchUsers,
  fetchHosts,
} = require("../../controllers/website/general-controller");
const { payForFlight, payForShortlet } = require("../../controllers/website/payment-controller");
const { paystackWebhook } = require("../../controllers/website/paystack-webhook-controller");
const { verifyAdminLoginToken } = require("../../controllers/admin/admin-auth-controller");
const { careerAppDocUpload } = require("../../utils/helpers/files");
const {
  verifyUserLoginToken,
} = require("../../controllers/website/user-auth-controller");

const router = express.Router();
router.post("/paystack-webhook", paystackWebhook);

router.get("/services", services);
router.post(
  "/record-flight-payment",
  validatePaymentRecord,
  validate,
  payForFlight,
  flightBookingPaymentReceivedEmail
);
router.post(
  "/record-shortlet-payment",
  verifyUserLoginToken,
  validatePaymentRecord,
  validate,
  payForShortlet,
  shortletBookingPaymentReceivedEmail,
  shortletBookingCompletedEmail
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
router.get("/fetch-waitlists", verifyAdminLoginToken, fetchWaitlists);
router.get("/fetch-users", verifyAdminLoginToken, fetchUsers);
router.get("/fetch-hosts", verifyAdminLoginToken, fetchHosts);

router.get("/jobs", fetchJobPostings);
router.get("/single-job/:id", fetchSingleJobPosting);
router.post("/apply-for-job/:id", careerAppDocUpload, applyForJob);

router.get("/post-categories", fetchPostCategories);
router.get("/all-help-articles", fetchAllHelpArticles);
router.get("/all-blogs", fetchAllBlogs);
router.get("/help-articles-category/:category", fetchHelpArticlesByCategory);
router.get("/single-post/:slug", fetchSinglePostBySlug);
router.get("/latest-travel-info", fetchLatestTravelInfo);

module.exports = router;
