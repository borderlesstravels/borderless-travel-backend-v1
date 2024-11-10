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
const router = express.Router();

router.get("/fetch-shortlets", fetchShortlets);
router.get("/fetch-shortlet/:id", fetchSingleShortlet);
router.get("/fetch-shortlet-reviews", fetchShortletReviews);
router.post(
  "/book-shortlet-auth/:apartment_id",
  verifyUserLoginToken,
  bookStayAUth
);

module.exports = router;
