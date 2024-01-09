const express = require('express');
const { verifyAdminLoginToken } = require('../../controllers/admin/admin-auth-controller');
const {
  updateUserProfile,
  deleteUser,
  fetchAllUsers,
  fetchSingleUser,
} = require('../../controllers/admin/admin-user-controller');

const router = express.Router();

router.put('/update-user-profile/:id', verifyAdminLoginToken, updateUserProfile);
router.delete('/delete-user/:id', verifyAdminLoginToken, deleteUser);
router.get('/fetch-all-users', verifyAdminLoginToken, fetchAllUsers);
router.get('/fetch-single-user/:id', verifyAdminLoginToken, fetchSingleUser);

module.exports = router;
