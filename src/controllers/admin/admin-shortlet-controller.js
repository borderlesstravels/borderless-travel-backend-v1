const ShortLet = require("../../models/host/ShortLet");
const { sendSuccess, sendError } = require("../../utils/helpers");

const allShortlets = async (req, res) => {
  try {
    const shortlets = await ShortLet.find().limit(req.query.limit);
    return sendSuccess(res, "Successfully fetched all shortlets", shortlets);
  } catch (error) {
    return sendError(res, "Cannot fetch shortlets data");
  }
};
const allAvaliableShortlets = async (req, res) => {
  try {
    const shortlets = await ShortLet.find({ status: "available" }).limit(
      req.query.limit
    );
    return sendSuccess(
      res,
      "Successfully fetched all available shortlets",
      shortlets
    );
  } catch (error) {
    return sendError(res, "Cannot fetch available shortlets data");
  }
};
const allUnavaliableShortlets = async (req, res) => {
  try {
    const shortlets = await ShortLet.find({ status: "unavailable" }).limit(
      req.query.limit
    );
    return sendSuccess(
      res,
      "Successfully fetched all unavailable shortlets",
      shortlets
    );
  } catch (error) {
    return sendError(res, "Cannot fetch unavailable shortlets data");
  }
};

module.exports = {
  allShortlets,
  allAvaliableShortlets,
  allUnavaliableShortlets,
};
