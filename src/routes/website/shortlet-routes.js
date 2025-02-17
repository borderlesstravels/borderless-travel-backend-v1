const express = require("express");
const {
  fetchShortlets,
  fetchSingleShortlet,
  fetchShortletReviews,
  bookStayAUth,
  fetchShortletsMinified,
  bookStayThirdParty,
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
router.get("/fetch-shortlets-location", fetchShortletsMinified);
router.get("/fetch-shortlet/:id", fetchSingleShortlet);
router.get("/fetch-shortlet-reviews/:product_reviewed", fetchShortletReviews);
router.post(
  "/book-shortlet-auth/:apartment_id",
  validateShortletParams,
  validate,
  verifyUserLoginToken,
  bookStayAUth
);
router.post(
  "/book-shortlet-tp/:apartment_id",
  validateShortletParams,
  validate,
  bookStayThirdParty
);

module.exports = router;
