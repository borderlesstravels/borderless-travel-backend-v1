const Markup = require('../../models/app-core/Markup');
const { sendError, sendSuccess } = require('../../utils/helpers');

const addMarkup = async (req, res) => {
  const adminId = req.id;
  const { service_name, api_provider, api_key, commission, service_region } = req.body;

  try {
    const existingMarkup = await Markup.findOne({ service_name: service_name.toLowerCase() });
    if (existingMarkup) {
      return sendError(res, `Markup data already exists for ${service_name.toLowerCase()} service`);
    }
  } catch (error) {
    return sendError(res, `Unable to verify if markup already exists - ${error}`);
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
    return sendSuccess(res, 'Successfully added th markup data', newMarkup);
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
      return sendSuccess(res, 'Successfully updated the markup data', selectedMarkup);
    } catch (err) {
      console.log(err);
      return sendError(res, 'Unable to update the markup data');
    }
  } catch (error) {
    return sendError(res, `Unable to verify if markup exists. You might have suppied wrong ID`);
  }
};

const deleteMarkup = async (req, res) => {
  try {
    await Markup.findByIdAndDelete(req.params.id);
    return sendSuccess(res, 'Successfully deleted the markup data');
  } catch (err) {
    console.log(err);
    return sendError(res, 'Unable to delete the markup data');
  }
};

const fetchSingleMarkup = async (req, res) => {
  try {
    const selectedMarkup = await Markup.findById(req.params.id);
    console.log('selectedMarkup', selectedMarkup);
    if (!selectedMarkup) {
      return sendError(res, 'The requested markup data does not exist');
    }
    return sendSuccess(res, 'Successfully fetched the requested data', selectedMarkup);
  } catch (error) {
    return sendError(res, `Could not find the requested markup data. Error - ${error}`);
  }
};

const allMarkups = async (req, res) => {
  try {
    const markups = await Markup.find().limit(req.query.limit);
    if (markups.length < 1) {
      return sendSuccess(res, 'No flight booking record found', null);
    } else {
      return sendSuccess(res, 'Successfully fetched the requested data', markups);
    }
  } catch (error) {
    return sendError(res, `Could not find the requested markup data. Error - ${error}`);
  }
};

module.exports = { addMarkup, editMarkup, deleteMarkup, fetchSingleMarkup, allMarkups };
