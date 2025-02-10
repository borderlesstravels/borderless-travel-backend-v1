const express = require("express");
const {
  verifyAdminLoginToken,
} = require("../../controllers/admin/admin-auth-controller");
const {
  validateAddMarkup,
  validate,
  validateAddAPIKey,
} = require("../../middlewares/validator");
const {
  addMarkup,
  editMarkup,
  deleteMarkup,
  fetchSingleMarkup,
  allMarkups,
  addAPIToken,
  editAPIToken,
  allAPITokens,
  fetchSingleAPIToken,
  deleteAPIToken,
} = require("../../controllers/admin/admin-app-settings-controller");

const router = express.Router();

router.post(
  "/add-markup",
  verifyAdminLoginToken,
  validateAddMarkup,
  validate,
  addMarkup
);

router.put("/edit-markup/:id", verifyAdminLoginToken, editMarkup);
router.delete("/delete-markup/:id", verifyAdminLoginToken, deleteMarkup);
router.get(
  "/fetch-single-markup/:id",
  verifyAdminLoginToken,
  fetchSingleMarkup
);
router.get("/fetch-all-markups", verifyAdminLoginToken, allMarkups);

router.post(
  "/generate-api-key",
  verifyAdminLoginToken,
  validateAddAPIKey,
  validate,
  addAPIToken
);
router.put("/edit-api-key/:id", verifyAdminLoginToken, editAPIToken);
router.delete("/delete-api-key/:id", verifyAdminLoginToken, deleteAPIToken);
router.get(
  "/fetch-single-api-key/:id",
  verifyAdminLoginToken,
  fetchSingleAPIToken
);
router.get("/fetch-all-api-keys", verifyAdminLoginToken, allAPITokens);

module.exports = router;
