const express = require('express');
const { contactUsEmail } = require('../../services/emailServices');
const {
  validateContactUsParams,
  validateSubscriptionParams,
  validate,
} = require('../../middlewares/validator');
const {
  saveSubscriber,
  applyForJob,
  fetchJobPostings,
  fetchSingleJobPosting,
} = require('../../controllers/website/general-controller');
const { careerAppDocUpload } = require('../../utils/helpers/files');

const router = express.Router();

router.post('/contact-us', validateContactUsParams, validate, contactUsEmail);
router.post('/subscribe', validateSubscriptionParams, validate, saveSubscriber);
router.get('/jobs', fetchJobPostings);
router.get('/single-job/:id', fetchSingleJobPosting);
router.post('/apply-for-job', careerAppDocUpload, applyForJob);

module.exports = router;
