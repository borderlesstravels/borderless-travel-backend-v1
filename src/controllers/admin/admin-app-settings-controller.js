const APIToken = require("../../models/app-core/APIToken");
const Markup = require("../../models/app-core/Markup");
const {
  sendError,
  sendSuccess,
  generateString,
} = require("../../utils/helpers");

const addMarkup = async (req, res) => {
  const adminId = req.id;
  const { service_name, api_provider, api_key, commission, service_region } =
    req.body;

  try {
    const existingMarkup = await Markup.findOne({
      service_name: service_name.toLowerCase(),
    });
    if (existingMarkup) {
      return sendError(
        res,
        `Markup data already exists for ${service_name.toLowerCase()} service`
      );
    }
  } catch (error) {
    return sendError(
      res,
      `Unable to verify if markup already exists - ${error}`
    );
  }

  const newMarkup = new Markup({
    service_name: service_name.toLowerCase(),
    api_provider,
    api_key,
    commission,
    service_region,
    action_by: adminId,
  });

  try {
    await newMarkup.save();
    return sendSuccess(res, "Successfully added th markup data", newMarkup);
  } catch (error) {
    return sendError(res, `Unable to add markup to th database - ${error}`);
  }
};

const editMarkup = async (req, res) => {
  req.body.service_name = req.body.service_name.toLowerCase();
  try {
    const existingMarkup = await Markup.findById(req.params.id);
    if (!existingMarkup) {
      return sendError(res, `Markup data does not exist`);
    }
    try {
      const selectedMarkup = await Markup.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true }
      );
      return sendSuccess(
        res,
        "Successfully updated the markup data",
        selectedMarkup
      );
    } catch (err) {
      console.log(err);
      return sendError(res, "Unable to update the markup data");
    }
  } catch (error) {
    return sendError(
      res,
      `Unable to verify if markup exists. You might have suppied wrong ID`
    );
  }
};

const deleteMarkup = async (req, res) => {
  try {
    await Markup.findByIdAndDelete(req.params.id);
    return sendSuccess(res, "Successfully deleted the markup data");
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to delete the markup data");
  }
};

const fetchSingleMarkup = async (req, res) => {
  try {
    const selectedMarkup = await Markup.findById(req.params.id);
    console.log("selectedMarkup", selectedMarkup);
    if (!selectedMarkup) {
      return sendError(res, "The requested markup data does not exist");
    }
    return sendSuccess(
      res,
      "Successfully fetched the requested data",
      selectedMarkup
    );
  } catch (error) {
    return sendError(
      res,
      `Could not find the requested markup data. Error - ${error}`
    );
  }
};

const allMarkups = async (req, res) => {
  try {
    const markups = await Markup.find().limit(req.query.limit);
    if (markups.length < 1) {
      return sendSuccess(res, "No flight booking record found", null);
    } else {
      return sendSuccess(
        res,
        "Successfully fetched the requested data",
        markups
      );
    }
  } catch (error) {
    return sendError(
      res,
      `Could not find the requested markup data. Error - ${error}`
    );
  }
};

const addAPIToken = async (req, res) => {
  const adminId = req.id;
  let { firm, commission } = req.body;
  firm = firm.toLowerCase();
  let api_key = generateString(32);

  try {
    const existingAppToken = await APIToken.findOne({ firm });
    if (existingAppToken) {
      return sendError(
        res,
        `API Token data already exists for ${firm.toLowerCase()} service`
      );
    }
    const newAppToken = new APIToken({
      firm,
      api_key,
      commission: commission ? commission : 0,
      action_by: adminId,
    });

    try {
      await newAppToken.save();
      return sendSuccess(
        res,
        `Successfully generated a new API Key for ${firm}`,
        newAppToken
      );
    } catch (err) {
      return sendError(
        res,
        `Unable to add new API Key to the database - ${err}`
      );
    }
  } catch (error) {
    return sendError(
      res,
      `Unable to verify if App Token already exists - ${error}`
    );
  }
};

const editAPIToken = async (req, res) => {
  req.body.firm = req.body?.firm?.toLowerCase();
  try {
    const existingAPIToken = await APIToken.findById(req.params.id);
    if (!existingAPIToken) {
      return sendError(res, `API Key data does not exist`);
    }
    try {
      const selectedAPIToken = await APIToken.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true }
      );
      return sendSuccess(
        res,
        "Successfully updated the API Key data",
        selectedAPIToken
      );
    } catch (err) {
      console.log(err);
      return sendError(res, "Unable to update the API Key data");
    }
  } catch (error) {
    return sendError(
      res,
      `Unable to verify if API Key exists. You might have suppied wrong ID`
    );
  }
};

const deleteAPIToken = async (req, res) => {
  try {
    await APIToken.findByIdAndDelete(req.params.id);
    return sendSuccess(res, "Successfully deleted the API Key data");
  } catch (err) {
    console.log(err);
    return sendError(res, "Unable to delete the API Key data");
  }
};

const fetchSingleAPIToken = async (req, res) => {
  try {
    const selectedAPIKey = await APIToken.findById(req.params.id);
    if (!selectedAPIKey) {
      return sendError(res, "The requested API Key data does not exist");
    }
    return sendSuccess(
      res,
      "Successfully fetched the requested data",
      selectedAPIKey
    );
  } catch (error) {
    return sendError(
      res,
      `Could not find the requested data. Error - ${error}`
    );
  }
};

const allAPITokens = async (req, res) => {
  try {
    const apiKeys = await APIToken.find().limit(req.query.limit);
    if (apiKeys.length < 1) {
      return sendSuccess(res, "No flight booking record found", null);
    } else {
      return sendSuccess(
        res,
        "Successfully fetched the requested data",
        apiKeys
      );
    }
  } catch (error) {
    return sendError(
      res,
      `Could not find the requested markup data. Error - ${error}`
    );
  }
};

module.exports = {
  addMarkup,
  editMarkup,
  deleteMarkup,
  fetchSingleMarkup,
  allMarkups,

  addAPIToken,
  editAPIToken,
  deleteAPIToken,
  fetchSingleAPIToken,
  allAPITokens,
};
