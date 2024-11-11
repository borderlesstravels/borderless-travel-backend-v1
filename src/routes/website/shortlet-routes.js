const express = require("express");
const {
  fetchShortlets,
  fetchSingleShortlet,
  fetchShortletReviews,
  bookStayAUth,
} = require("../../controllers/website/shortlet-controller");
const {
  verifyUserLoginToken,
} = require("../../controllers/website/user-auth-controller");
const {
  validate,
  validateShortletParams,
} = require("../../middlewares/validator");
const router = express.Router();

router.get("/fetch-shortlets", fetchShortlets);
router.get("/fetch-shortlet/:id", fetchSingleShortlet);
router.get("/fetch-shortlet-reviews/:product_reviewed", fetchShortletReviews);
router.post(
  "/book-shortlet-auth/:apartment_id",
  validateShortletParams,
  validate,
  verifyUserLoginToken,
  bookStayAUth
);

module.exports = router;
