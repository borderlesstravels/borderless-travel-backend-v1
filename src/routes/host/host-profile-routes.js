const express = require('express');

const { passwordUpdatedEmail, profileUpdatedEmail } = require('../../services/emailServices');
const { verifyHostLoginToken } = require('../../controllers/website/host-auth-controller');
const {
  getHost,
  updateHostProfile,
  updateHostPassword,
  logoutHost,
  isHostLogin,
} = require('../../controllers/host/host-profile-controller');
const {
  validateUpdateProfileHostParams,
  validate,
  validateUpdatePasswordParams,
} = require('../../middlewares/validator');

const router = express.Router();

// Profile
router.get('/profile', verifyHostLoginToken, getHost);
router.put(
  '/update-profile',
  verifyHostLoginToken,
  validateUpdateProfileHostParams,
  validate,
  updateHostProfile
);
router.put(
  '/update-password',
  verifyHostLoginToken,
  validateUpdatePasswordParams,
  validate,
  updateHostPassword,
  passwordUpdatedEmail
);

router.get('/check-session', isHostLogin);
router.post('/logout', logoutHost);

module.exports = router;
