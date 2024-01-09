const Job = require('../../models/general/Job');
const JobApplication = require('../../models/general/JobApplication');
const Subscriber = require('../../models/general/Subscriber');
const { sendError } = require('../../utils/helpers');

const saveSubscriber = async (req, res) => {
  let existingContact;
  try {
    existingContact = await Subscriber.findOne({ email: req.body.email });
    if (existingContact) {
      return sendError(res, 'You have already joined our list using this email address.');
    }
  } catch (error) {
    if (existingContact) {
      return sendError(res, 'Could not verify that you are not an existing contact');
    }
  }
  const newSubscriber = new Subscriber(req.body);
  try {
    await newSubscriber.save();
    res.status(200).json({
      success: true,
      message: 'You have successfully subscribed to our mailing list. Watch our for future updates',
      data: newSubscriber,
    });
  } catch (error) {
    sendError(res, 'Could not save your details to our subscription list');
  }
};

// Career
const fetchJobPostings = async (req, res, next) => {
  try {
    const jobs = await Job.find().limit(req.query.limit);
    if (jobs.length < 1) {
      res.status(200).json({ success: true, message: 'No job offer available at the moment' });
    } else {
      res
        .status(200)
        .json({ success: true, message: 'Successfully fetched job postings', data: jobs });
    }
  } catch (error) {
    return sendError(res, 'Something went wrong. Could not fetch available jobs.', 500);
  }
};
const fetchSingleJobPosting = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    res
      .status(200)
      .json({ success: true, message: 'Successfully fetched the job posting', data: job });
  } catch (error) {
    return sendError(res, 'Could not find the job posting.', 500);
  }
};
const applyForJob = async (req, res, next) => {
  const rawImagesArray = req.files['documents'];
  const namedImage = rawImagesArray.map((a) => a.filename);
  const stringnifiedImages = JSON.stringify(namedImage);
  const formmatedImages = stringnifiedImages.replace(/[^a-zA-Z0-9_.,]/g, '');
  const documents = formmatedImages.replace(/[,]/g, ', ');
  const { first_name, last_name, email } = req.body;
  const newApplication = new JobApplication({
    first_name,
    last_name,
    email,
    documents,
  });
  try {
    await newApplication.save();
    res.status(200).json({
      success: true,
      message: 'We have received your job application. We will reach out to you soon.',
    });
  } catch (error) {
    return sendError(res, 'Unable to submit your job application', 500);
  }
};

module.exports = { saveSubscriber, fetchJobPostings, fetchSingleJobPosting, applyForJob };
