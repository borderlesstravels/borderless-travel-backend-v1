const { sendError } = require('../../utils/helpers');
const Subscriber = require('../../models/general/Subscriber');

const updateEmailSubContact = async (req, res) => {
  try {
    const savedEmailSubData = await Subscriber.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      message: 'Successfully updated the email subscription contact',
      data: savedEmailSubData,
    });
  } catch (err) {
    console.log(err);
    return sendError(res, 'Unable to update the email subscription contact');
  }
};

const deleteEmailContact = async (req, res) => {
  try {
    await Subscriber.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Successfully deleted the email contact',
    });
  } catch (err) {
    console.log(err);
    return sendError(res, 'Unable to delete the admin profile');
  }
};

const fetchAllEmailContacts = async (req, res) => {
  const { min, max, ...others } = req.query;
  try {
    const contacts = await Subscriber.find({
      ...others,
      cheapestPrice: { $gt: min | 1, $lt: max || 999 },
    }).limit(req.query.limit);
    return res.status(200).json({ success: true, data: contacts });
  } catch (error) {
    return sendError(res, 'Unable to fetch the email contacts list data');
  }
};

const fetchSingleContact = async (req, res) => {
  const { id } = req.params;
  try {
    const contact = await Subscriber.findById(id);
    if (!contact) {
      return sendError(res, 'Email contact data does not exist');
    }
    return res.status(200).json({ success: true, data: contact });
  } catch (error) {
    return sendError(res, 'Unable to fetch the email contact data');
  }
};

module.exports = {
  updateEmailSubContact,
  deleteEmailContact,
  fetchAllEmailContacts,
  fetchSingleContact,
};
