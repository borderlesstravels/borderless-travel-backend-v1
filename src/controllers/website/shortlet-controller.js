const Review = require("../../models/general/Review");
const ShortLet = require("../../models/host/ShortLet");
const { sendError, sendSuccess } = require("../../utils/helpers");

const fetchShortlets = async (req, res) => {
  try {
    const shortlets = await ShortLet.find().limit(req.query.limit);
    if (!shortlets.length) {
      return sendSuccess(res, "No shortlet apartments record yet");
    }
    return sendSuccess(
      res,
      "Successfully fetched the available shortlet apartments",
      shortlets
    );
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to fetch available shortlets");
  }
};

const fetchSingleShortlet = async (req, res) => {
  try {
    const shortlet = await ShortLet.findById(req.params.id);
    // console.log("shortlet", shortlet);
    if (!shortlet) {
      return sendSuccess(
        res,
        "No such shortlet apartment exists or no longer exists"
      );
    }
    return sendSuccess(
      res,
      "Successfully fetched the requested shortlet apartment",
      shortlet
    );
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to fetch the requested shortlet apartment");
  }
};

const fetchShortletReviews = async (req, res) => {
  try {
    const reviews = await Review.find();
    if (!reviews.length) {
      return sendSuccess(res, "No reviews record yet");
    }
    const shortletReviews = reviews.filter(
      (item) => item.product_reviewed == req.params.id
    );
    if (!shortletReviews.length) {
      return sendSuccess(res, "This shortlet apartment has no reviews yet");
    }
    return sendSuccess(
      res,
      "Successfully fetched the shortlet reviews",
      shortletReviews
    );
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to fetch available shortlets");
  }
};

module.exports = {
  fetchShortlets,
  fetchSingleShortlet,
  fetchShortletReviews,
};
