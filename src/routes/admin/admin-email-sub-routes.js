const express = require('express');
const { verifyAdminLoginToken } = require('../../controllers/admin/admin-auth-controller');
const {
  updateEmailSubContact,
  deleteEmailContact,
  fetchAllEmailContacts,
  fetchSingleContact,
} = require('../../controllers/admin/admin-email-sub-controller');

const router = express.Router();

router.put('/edit-contact/:id', verifyAdminLoginToken, updateEmailSubContact);
router.delete('/delete-contact/:id', verifyAdminLoginToken, deleteEmailContact);
router.get('/fetch-all-contacts', verifyAdminLoginToken, fetchAllEmailContacts);
router.get('/fetch-single-contact/:id', verifyAdminLoginToken, fetchSingleContact);

module.exports = router;
