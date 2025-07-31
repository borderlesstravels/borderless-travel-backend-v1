const { fetcher_ip_details } = require("../../api/fetcher");
const Markup = require("../../models/app-core/Markup");
const Content = require("../../models/content/Content");
const ContentCategory = require("../../models/content/ContentCategory");
const BookingRequest = require("../../models/general/BookingRequest");
const FlightBooking = require("../../models/general/FlightBooking");
const Job = require("../../models/general/Job");
const JobApplication = require("../../models/general/JobApplication");
const Payment = require("../../models/general/Payment");
const ShortletBooking = require("../../models/general/ShortletBooking");
const Subscriber = require("../../models/general/Subscriber");
const Waitlist = require("../../models/general/Waitlist");
const User = require("../../models/user/User");
const {
  sendError,
  sendSuccess,
  badRequestError,
  shuffleArray,
  dateFormatter,
  formatCurrency,
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

const payForFlight = async (req, res, next) => {
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

      const date = dateFormatter(booking.created_at);
      const amountPaid = formatCurrency(amount);

      req.body = {
        first_name: booking.contact_name.split(" ")[0],
        email: booking.client_email,
        amountPaid: amountPaid,
        booking_reference: booking.booking_reference,
        date,
        route: `${booking.origin} - ${booking.destination}`,
        flight: booking.airline,
        booking_id: booking._id,
      };

      next();
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

const payForShortlet = async (req, res, next) => {
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

      const check_in_date = dateFormatter(booking.check_in_date);
      const check_out_date = dateFormatter(booking.check_out_date);
      const amountPaid = formatCurrency(amount);

      req.body = {
        first_name: booking.name.split(" ")[0],
        email: booking.email,
        apartment_name: booking.apartment_name,
        amountPaid: amountPaid,
        booking_reference: booking.booking_reference,
        location: `${booking.apartment_address}, ${booking.apartment_city}, ${booking.apartment_country}`,
        check_in_date,
        check_out_date,
        booking_id: booking._id,
      };

      next();
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
        "You have already subscribed using this email address."
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
    } catch (err) {
      sendError(
        res,
        `Could not save your details to our subscription list. Eror - ${err}`
      );
    }
  } catch (error) {
    return sendError(
      res,
      `Could not verify that you are not an existing contact. Error - ${error}`
    );
  }
};

const saveWaitlist = async (req, res, next) => {
  let existingContact;
  try {
    const ip_data = await fetcher_ip_details();
    if (ip_data.status == 200) {
      req.body.country = ip_data.data.country_name;
      req.body.city = ip_data.data.city;
    }
    existingContact = await Waitlist.findOne({ email: req.body.email });
    if (existingContact) {
      return sendError(
        res,
        "You have already joined our list using this email address."
      );
    }
    const newSubscriber = new Waitlist(req.body);
    try {
      await newSubscriber.save();
      req.body = {
        subscriber: newSubscriber,
      };
      next();
    } catch (err) {
      sendError(
        res,
        `Could not save your details to our subscription list. Eror - ${err}`
      );
    }
  } catch (error) {
    return sendError(
      res,
      `Could not verify that you are not an existing subscriber. Error - ${error}`
    );
  }
};
const fetchWaitlists = async (req, res) => {
  try {
    const waitlists = await Waitlist.find().limit(req.query.limit);
    return sendSuccess(res, "Successfully fetched Waitlist data", waitlists);
  } catch (error) {
    return sendError(
      res,
      "Something went wrong. Could not fetch available waitlists.",
      500
    );
  }
};

// Career
const fetchJobPostings = async (req, res, next) => {
  try {
    const jobs = await Job.find().limit(req.query.limit);
    if (jobs.length < 1) {
      return res.status(200).json({
        success: true,
        message: "No job offer available at the moment",
      });
    } else {
      return res.status(200).json({
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
    const rawFileArray = req.files["files"];

    if (!rawFileArray) {
      return badRequestError(res, "Resume missing!");
    }

    const namedFiles = rawFileArray.map((a) => a.filename);
    const stringnifiedFiles = JSON.stringify(namedFiles);
    const formmatedFiles = stringnifiedFiles.replace(/[^a-zA-Z0-9_.,]/g, "");
    const files = formmatedFiles.replace(/[,]/g, ", ");
    console.log("files: ", files);
    req.body.files = files;

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

// Content
const fetchPostCategories = async (req, res) => {
  try {
    const postCategories = await ContentCategory.find().limit(req.query.limit);
    return sendSuccess(
      res,
      "Succesfully fetched post categories",
      postCategories
    );
  } catch (error) {
    return sendError(res, "Unable to fetch the post categories data");
  }
};
const fetchAllHelpArticles = async (req, res, next) => {
  try {
    const posts = await Content.find().limit(req.query.limit);
    const allHelpPosts = posts.filter(
      (item) => item.category !== "blog".toLowerCase()
    );
    return sendSuccess(res, "Succesfully fetched help posts", allHelpPosts);
  } catch (error) {
    console.log("fetch help articles error", error);
    return sendError(res, "Unable to fetch the posts data");
  }
};
const fetchAllBlogs = async (req, res, next) => {
  try {
    const blogs = await Content.find({ category: "blog".toLowerCase() }).limit(
      req.query.limit
    );
    return sendSuccess(res, "Succesfully fetched all blogs", blogs);
  } catch (error) {
    console.log("fetch help articles error", error);
    return sendError(res, "Unable to fetch the posts data");
  }
};
const fetchHelpArticlesByCategory = async (req, res, next) => {
  try {
    const posts = await Content.find({ category: req.params.category }).limit(
      req.query.limit
    );
    return sendSuccess(res, "Succesfully fetched posts", posts);
  } catch (error) {
    return sendError(res, "Unable to fetch the posts data");
  }
};
const fetchSinglePostBySlug = async (req, res) => {
  try {
    const post = await Content.findOne({ slug: req.params.slug.toLowerCase() });
    if (!post) {
      return sendError(res, "post does not exist");
    }
    const postCount = post.views_count;
    post.views_count = Number(postCount + 1);
    await post.save();
    return sendSuccess(res, "Succesfully fetched post", post);
  } catch (error) {
    console.log("fetchSinglePostBySlug error", error);
    return sendError(res, "Unable to fetch the post profile data");
  }
};

// Homepage
const fetchLatestTravelInfo = async (req, res) => {
  try {
    const posts = await Content.find({ category: "flight" }).limit(
      req.query.limit
    );
    const shuffledArrs = await shuffleArray(posts);
    const arrData = shuffledArrs.slice(0, 3);
    return sendSuccess(res, "Succesfully fetched posts", arrData);
  } catch (error) {
    return sendError(res, "Unable to fetch the posts data");
  }
};

module.exports = {
  services,
  payForFlight,
  payForShortlet,
  saveSubscriber,
  saveWaitlist,
  fetchWaitlists,

  fetchJobPostings,
  fetchSingleJobPosting,
  applyForJob,

  fetchPostCategories,
  fetchAllHelpArticles,
  fetchAllBlogs,
  fetchHelpArticlesByCategory,
  fetchSinglePostBySlug,
  fetchLatestTravelInfo,
};
