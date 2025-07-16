const express = require("express");
const {
  verifyAdminLoginToken,
} = require("../../controllers/admin/admin-auth-controller");
const {
  allShortlets,
  allAvaliableShortlets,
  allUnavaliableShortlets,
} = require("../../controllers/admin/admin-shortlet-controller");
const router = express.Router();

router.get("/all-shortlets", verifyAdminLoginToken, allShortlets);
router.get(
  "/available-shortlets",
  verifyAdminLoginToken,
  allAvaliableShortlets
);
router.get(
  "/unavailable-shortlets",
  verifyAdminLoginToken,
  allUnavaliableShortlets
);

module.exports = router;
