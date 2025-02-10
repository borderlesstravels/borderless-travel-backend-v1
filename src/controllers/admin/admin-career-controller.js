const {
  sendError,
  sendSuccess,
  badRequestError,
} = require("../../utils/helpers");
const Subscriber = require("../../models/general/Subscriber");
const { log } = require("console");
const Job = require("../../models/general/Job");
const JobApplication = require("../../models/general/JobApplication");

const addNewJob = async (req, res) => {
  const rawCoverArray = req.files["job_cover"];
  if (!rawCoverArray) {
    return badRequestError(res, "Please add a job cover image");
  }
  const namedCover = rawCoverArray.map((a) => a.filename);
  const stringnifiedCover = JSON.stringify(namedCover);
  const formmatedCover = stringnifiedCover.replace(/[^a-zA-Z0-9_.,]/g, "");
  const cover = formmatedCover.replace(/[,]/g, ", ");
  console.log("cover: ", cover);
  req.body.job_cover = cover;

  try {
    req.body.requirements = req.body.requirements.split(", ");
    req.body.responsibilities = req.body.responsibilities.split(", ");
    const newJob = new Job(req.body);
    await newJob.save();
    return sendSuccess(res, "Successfully added a new job", newJob);
  } catch (err) {
    return sendError(res, "Unable to save the job offer to the database", 500);
  }
};

const editJobOffer = async (req, res) => {
  try {
    const savedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    return sendSuccess(res, "Successfully updated the job offer", savedJob);
  } catch (err) {
    console.log(err);
    return sendError(res, "Unable to update the job offer");
  }
};

const deleteJobOffer = async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    return sendSuccess(res, "Successfully deleted the job data");
  } catch (err) {
    console.log(err);
    return sendError(res, "Unable to delete the job data");
  }
};

const fetchAllJobApplications = async (req, res, next) => {
  try {
    const jobApplications = await JobApplication.find();
    return sendSuccess(
      res,
      `Successfully fetched all applications`,
      jobApplications
    );
  } catch (error) {
    return sendError(
      res,
      "Something went wrong. Could not fetch available jobs."
    );
  }
};

const fetchJobPostApplications = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return sendError(res, "The selected job does not exist");
    }
    const jobApplications = await JobApplication.find({ jobId: job._id });
    return sendSuccess(
      res,
      `Successfully fetched applications for ${job.title}`,
      jobApplications
    );
  } catch (error) {
    return sendError(
      res,
      "Something went wrong. Could not fetch available jobs.",
      500
    );
  }
};

const deleteJobApplication = async (req, res) => {
  try {
    await JobApplication.findByIdAndDelete(req.params.id);
    return sendSuccess(res, "Successfully deleted the job application data");
  } catch (err) {
    console.log(err);
    return sendError(res, "Unable to delete the job application data");
  }
};

module.exports = {
  addNewJob,
  editJobOffer,
  deleteJobOffer,

  fetchAllJobApplications,
  fetchJobPostApplications,
  deleteJobApplication,
};
