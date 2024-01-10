const { sendError } = require('../../utils/helpers');
const Subscriber = require('../../models/general/Subscriber');
const { log } = require('console');
const Job = require('../../models/general/Job');

const addNewJob = async (req, res) => {
  const newJob = new Job(req.body);
  try {
    await newJob.save();
    res.status(200).json({ success: true, message: 'Successfully added a new job', data: newJob });
  } catch (err) {
    return sendError(res, 'Unable to save the job offer to the databse', 500);
  }
};

const editJobOffer = async (req, res) => {
  try {
    const savedJob = await Job.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    return res.status(200).json({
      success: true,
      message: 'Successfully updated the job offer',
      data: savedJob,
    });
  } catch (err) {
    console.log(err);
    return sendError(res, 'Unable to update the job offer');
  }
};

const deleteJobOffer = async (req, res) => {
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

module.exports = {
  addNewJob,
  editJobOffer,
  deleteJobOffer,
};
