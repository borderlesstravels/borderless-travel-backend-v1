const express = require('express');
const { verifyAdminLoginToken } = require('../../controllers/admin/admin-auth-controller');
const { validateAddMarkup, validate } = require('../../middlewares/validator');
const {
  addMarkup,
  editMarkup,
  deleteMarkup,
  fetchSingleMarkup,
  allMarkups,
} = require('../../controllers/admin/admin-app-settings-controller');

const router = express.Router();

router.post('/add-markup', verifyAdminLoginToken, validateAddMarkup, validate, addMarkup);

router.put('/edit-markup/:id', verifyAdminLoginToken, editMarkup);
router.delete('/delete-markup/:id', verifyAdminLoginToken, deleteMarkup);
router.get('/fetch-single-markup/:id', verifyAdminLoginToken, fetchSingleMarkup);
router.get('/fetch-all-markups', verifyAdminLoginToken, allMarkups);

module.exports = router;
