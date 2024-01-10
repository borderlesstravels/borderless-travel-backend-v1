const express = require('express');
const { verifyAdminLoginToken } = require('../../controllers/admin/admin-auth-controller');
const { validateAddJob } = require('../../middlewares/validator');
const {
  addNewJob,
  editJobOffer,
  deleteJobOffer,
} = require('../../controllers/admin/admin-career-controller');

const router = express.Router();

router.post('/add-new-job', verifyAdminLoginToken, validateAddJob, addNewJob);
router.put('/edit-job-offer/:id', verifyAdminLoginToken, editJobOffer);
router.delete('/delete-job-offer/:id', verifyAdminLoginToken, deleteJobOffer);

module.exports = router;
