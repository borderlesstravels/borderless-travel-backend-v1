const express = require("express");
const {
  fetchShortlets,
  fetchSingleShortlet,
  fetchShortletReviews,
} = require("../../controllers/website/shortlet-controller");
const router = express.Router();

router.get("/fetch-shortlets", fetchShortlets);
router.get("/fetch-shortlet/:id", fetchSingleShortlet);
router.get("/fetch-shortlet-reviews", fetchShortletReviews);

module.exports = router;
