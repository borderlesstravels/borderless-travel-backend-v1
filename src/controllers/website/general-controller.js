const Markup = require("../../models/app-core/Markup");
const FlightBooking = require("../../models/general/FlightBooking");
const Job = require("../../models/general/Job");
const JobApplication = require("../../models/general/JobApplication");
const Payment = require("../../models/general/Payment");
const ShortletBooking = require("../../models/general/ShortletBooking");
const Subscriber = require("../../models/general/Subscriber");
const User = require("../../models/user/User");
const {
  sendError,
  sendSuccess,
  badRequestError,
} = require("../../utils/helpers");

const services = async (req, res) => {
  try {
    const services = await Markup.find().select([
      "-commission",
      "-api_provider",
      "-api_key",
      "-action_by",
      "-created_at",
      "-__v",
    ]);
    if (services.length < 1) {
      return sendSuccess(res, "No services record found", null);
    }
    return sendSuccess(res, "Successfully fetched services", services);
  } catch (error) {
    return sendError(
      res,
      "Something went wrong. Could not fetch services",
      500
    );
  }
};

const payForFlight = async (req, res) => {
  const userId = req.id;
  const {
    service_name,
    booking_reference,
    transaction_reference,
    amount,
    time,
  } = req.body;

  const user = await User.findById(userId, "-password");
  if (!user) return sendError(res, "Sorry, please login first");

  try {
    const markup = await Markup.findOne({ service_name: service_name });
    if (!markup) {
      return sendError(res, "The selected service does not exist");
    }

    try {
      const booking = await FlightBooking.findOne({
        booking_reference: booking_reference,
      });
      if (!booking) {
        return sendError(res, "No booking record found");
      }
      if (booking.payment_status === "paid") {
        return badRequestError(res, "You have already paid for this service");
      }
      const commission_percent = markup.commission;
      const commission_amount = (commission_percent / 100) * amount;
      const service_amount = amount - commission_amount;
      const newPayment = new Payment({
        owner: userId,
        service_name,
        payer_name: `${user.first_name} ${user.last_name}`,
        payer_email: user.email,
        booking_reference,
        transaction_reference,
        amount_paid: amount,
        service_amount,
        commission_percent,
        commission_amount,
        transaction_time: time,
      });
      booking.payment_status = "paid";
      await booking.save();
      await newPayment.save();
      return sendSuccess(
        res,
        "Your payment has been successfully completed",
        booking._id
      );
    } catch (error) {
      return sendError(res, `Unable to record your payment. Error - ${error}`);
    }
  } catch (error) {
    return sendError(
      res,
      `Unable to record your payment. Reach out to our support with the payment ID. Error - ${error}`
    );
  }
};

const payForShortlet = async (req, res) => {
  const userId = req.id;
  const {
    service_name,
    booking_reference,
    transaction_reference,
    amount,
    time,
  } = req.body;

  const user = await User.findById(userId, "-password");
  if (!user) return sendError(res, "Sorry, please login first");

  try {
    const markup = await Markup.findOne({ service_name: service_name });
    if (!markup) {
      return sendError(res, "The selected service does not exist");
    }

    try {
      const booking = await ShortletBooking.findOne({
        booking_reference: booking_reference,
      });
      if (!booking) {
        return sendError(res, "No booking record found");
      }
      if (booking.payment_status === "paid") {
        return badRequestError(res, "You have already paid for this service");
      }
      if (booking.status !== "confirmed") {
        return badRequestError(res, "Apartment availability not yet confirmed");
      }
      const commission_percent = markup.commission;
      const commission_amount = (commission_percent / 100) * amount;
      const service_amount = amount - commission_amount;
      const newPayment = new Payment({
        owner: userId,
        service_name,
        payer_name: `${user.first_name} ${user.last_name}`,
        payer_email: user.email,
        booking_reference,
        transaction_reference,
        amount_paid: amount,
        service_amount,
        commission_percent,
        commission_amount,
        transaction_time: time,
      });
      booking.payment_status = "paid";
      booking.status = "paid";
      await booking.save();
      await newPayment.save();
      return sendSuccess(
        res,
        "Your payment has been successfully completed",
        booking._id
      );
    } catch (error) {
      return sendError(res, `Unable to record your payment. Error - ${error}`);
    }
  } catch (error) {
    return sendError(
      res,
      `Unable to record your payment. Reach out to our support with the payment ID. Error - ${error}`
    );
  }
};

const saveSubscriber = async (req, res) => {
  let existingContact;
  try {
    existingContact = await Subscriber.findOne({ email: req.body.email });
    if (existingContact) {
      return sendError(
        res,
        "You have already joined our list using this email address."
      );
    }
  } catch (error) {
    return sendError(
      res,
      "Could not verify that you are not an existing contact"
    );
  }
  const newSubscriber = new Subscriber(req.body);
  try {
    await newSubscriber.save();
    return sendSuccess(
      res,
      "You have successfully subscribed to our mailing list. Watch our for future updates",
      newSubscriber
    );
  } catch (error) {
    sendError(res, "Could not save your details to our subscription list");
  }
};

// Career
const fetchJobPostings = async (req, res, next) => {
  try {
    const jobs = await Job.find().limit(req.query.limit);
    if (jobs.length < 1) {
      res.status(200).json({
        success: true,
        message: "No job offer available at the moment",
      });
    } else {
      res.status(200).json({
        success: true,
        message: "Successfully fetched job postings",
        data: jobs,
      });
    }
  } catch (error) {
    return sendError(
      res,
      "Something went wrong. Could not fetch available jobs.",
      500
    );
  }
};
const fetchSingleJobPosting = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return sendError(res, "The selected job does not exist");
    }
    return sendSuccess(res, "Successfully fetched the job posting", job);
  } catch (error) {
    return sendError(res, "Could not find the job posting.", 500);
  }
};
const applyForJob = async (req, res, next) => {
  const jobId = req.params.id;
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return sendError(res, "The selected job does not exist");
    }
    req.body.jobId = jobId;
    const rawResumeArray = req.files["resume"];
    const rawCoverArray = req.files["cover"];
    if (!rawResumeArray) {
      return badRequestError(res, "Please add your resume");
    }
    if (rawCoverArray) {
      const namedCover = rawCoverArray.map((a) => a.filename);
      const stringnifiedCover = JSON.stringify(namedCover);
      const formmatedCover = stringnifiedCover.replace(/[^a-zA-Z0-9_.,]/g, "");
      const cover = formmatedCover.replace(/[,]/g, ", ");
      console.log("cover: ", cover);
      req.body.cover = cover;
    }
    const namedResume = rawResumeArray.map((a) => a.filename);
    const stringnifiedResume = JSON.stringify(namedResume);
    const formmatedResume = stringnifiedResume.replace(/[^a-zA-Z0-9_.,]/g, "");
    const resume = formmatedResume.replace(/[,]/g, ", ");
    console.log("resume: ", resume);
    req.body.resume = resume;

    const newApplication = new JobApplication(req.body);
    try {
      await newApplication.save();
      res.status(200).json({
        success: true,
        message:
          "We have received your job application. We will reach out to you soon.",
      });
    } catch (error) {
      return sendError(res, "Unable to submit your job application", 500);
    }
  } catch (error) {
    return sendError(res, "Could not locate the job posting. Try again");
  }
};

module.exports = {
  services,
  payForFlight,
  payForShortlet,
  saveSubscriber,
  fetchJobPostings,
  fetchSingleJobPosting,
  applyForJob,
};
