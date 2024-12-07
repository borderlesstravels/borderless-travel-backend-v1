const jwt = require("jsonwebtoken");
const Host = require("../../models/host/Host");
const ShortLet = require("../../models/host/ShortLet");
const {
  sendError,
  sendSuccess,
  saveNotification,
} = require("../../utils/helpers");
const bcrypt = require("bcryptjs");
const Review = require("../../models/general/Review");
const Notification = require("../../models/general/Notification");
const ShortletBooking = require("../../models/general/ShortletBooking");
const User = require("../../models/user/User");
const Markup = require("../../models/app-core/Markup");

const getHost = async (req, res) => {
  const userId = req.id;
  let host;
  try {
    host = await Host.findById(userId, "-password");
    if (!host) {
      return sendError(res, "Profile not found");
    }
    return sendSuccess(res, "Successfully fetched data", host);
  } catch (err) {
    console.log("err", err);
    return sendError(res, "Cannot fetch host profile", 500);
  }
};

const getHostNotifications = async (req, res) => {
  const userId = req.id;
  try {
    const notifications = await Notification.find();
    if (!notifications.length) {
      return sendSuccess(res, "No notifications record yet");
    }
    const hostNotifications = notifications.filter(
      (item) => item.owner == userId
    );
    if (!hostNotifications.length) {
      return sendSuccess(res, "You have no notifications at this time");
    }
    return sendSuccess(res, "Successfully fetched data", hostNotifications);
  } catch (err) {
    console.log("err", err);
    return sendError(res, "Cannot fetch host's notifications", 500);
  }
};

const getHostReviews = async (req, res) => {
  const userId = req.id;
  try {
    const reviews = await Review.find();
    if (!reviews.length) {
      return sendSuccess(res, "No reviews record yet");
    }
    const hostReviews = reviews.filter((item) => item.property_owner == userId);
    if (!hostReviews.length) {
      return sendSuccess(res, "You have no reviews yet");
    }
    return sendSuccess(res, "Successfully fetched data", hostReviews);
  } catch (err) {
    console.log("err", err);
    return sendError(res, "Cannot fetch host's reviews", 500);
  }
};

// **
// **
// Property Management
const addProperty = async (req, res) => {
  const rawImagesArray = req.files && req.files["images"];
  const namedImage = rawImagesArray?.map((a) => a.filename);
  const stringnifiedImages = JSON.stringify(namedImage);
  const formmatedImages = stringnifiedImages?.replace(/[^a-zA-Z0-9_.,]/g, "");
  const images = formmatedImages?.replace(/[,]/g, ", ");
  req.body.images = images;
  req.body.owner = req.id;
  console.log("req body", req.body);
  console.log("images", images);
  // let commission_amount = 0;

  try {
    const markup = await Markup.findOne({ service_name: "stay" });
    if (markup) {
      const commission_percent = markup.commission;

      if (Number(req.body.single_price) > 0) {
        const price = req.body.single_price;
        const commission_amount =
          (Number(commission_percent) / 100) * Number(price);
        req.body.single_price = Number(price) + Number(commission_amount);
      }
      if (Number(req.body.suites_price) > 0) {
        const price = req.body.suites_price;
        const commission_amount =
          (Number(commission_percent) / 100) * Number(price);
        req.body.suites_price = Number(price) + Number(commission_amount);
      }
      if (Number(req.body.executive_price) > 0) {
        const price = req.body.executive_price;
        const commission_amount =
          (Number(commission_percent) / 100) * Number(price);
        req.body.executive_price = Number(price) + Number(commission_amount);
      }
    }
    const property = new ShortLet(req.body);
    await property.save();
    return sendSuccess(
      res,
      `Successfully added a new listing - ${req.body.apartment_name}`,
      property
    );
  } catch (err) {
    console.log(err);
    return sendError(res, "Unable to add a new listing");
  }
};

const editProperty = async (req, res) => {
  let files;
  files = req?.files;

  if (files) {
    const rawImagesArray = req.files && req.files["images"];
    const namedImage = rawImagesArray?.map((a) => a.filename);
    const stringnifiedImages = JSON.stringify(namedImage);
    const formmatedImages = stringnifiedImages?.replace(/[^a-zA-Z0-9_.,]/g, "");
    const images = formmatedImages?.replace(/[,]/g, ", ");
    req.body.images = images;
    console.log("images", images);
  }
  console.log("req body", req.body);
  let commission_amount = 0;

  try {
    const selectedProperty = await ShortLet.findById(req.params.id);
    console.log("selectedProperty", selectedProperty);
    if (selectedProperty.owner != req.id) {
      return sendError(
        res,
        "You are not authenticated to modify this property"
      );
    }

    const markup = await Markup.findOne({ service_name: "stay" });
    if (markup) {
      const commission_percent = markup.commission;
      commission_amount = (commission_percent / 100) * amount;
    }
    if (req.body.single_price != selectedProperty.single_price) {
      if (Number(req.body.single_price) > 0) {
        req.body.single_price =
          Number(req.body.single_price) + commission_amount;
      }
    }
    if (req.body.suites_price != selectedProperty.suites_price) {
      if (Number(req.body.suites_price) > 0) {
        req.body.suites_price =
          Number(req.body.suites_price) + commission_amount;
      }
    }
    if (req.body.executive_price != selectedProperty.executive_price) {
      if (Number(req.body.executive_price) > 0) {
        req.body.executive_price =
          Number(req.body.executive_price) + commission_amount;
      }
    }

    const property = await ShortLet.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    return sendSuccess(
      res,
      `Successfully updated the listing - ${req.body.apartment_name}`,
      property
    );
  } catch (err) {
    console.log(err);
    return sendError(res, "Unable to update the listing data");
  }
};

const getHostProperties = async (req, res) => {
  const userId = req.id;
  try {
    const properties = await ShortLet.find();
    if (!properties.length) {
      return sendSuccess(res, "No listings record yet");
    }
    const hostProperties = properties.filter((item) => item.owner == userId);
    if (!hostProperties.length) {
      return sendSuccess(res, "You have no listings yet");
    }
    return sendSuccess(res, "Successfully fetched data", hostProperties);
  } catch (err) {
    console.log("err", err);
    return sendError(res, "Cannot fetch host's listings", 500);
  }
};

const fetchSingleShortlet = async (req, res) => {
  try {
    const shortlet = await ShortLet.findById(req.params.id);
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

const approveShortletBooking = async (req, res) => {
  try {
    const apartmentBooking = await ShortletBooking.findById(req.params.id);
    if (apartmentBooking.apartment_owner !== req.id)
      return sendError(res, "Apartment is not owned by you!");
    if (apartmentBooking.status === "confirmed")
      return sendError(
        res,
        "Apartment's availability had already been confirmed!"
      );
    if (!apartmentBooking)
      return sendError(res, "Such apartment post cannot be found!");
    apartmentBooking.status = "confirmed";

    const user = await User.findById(apartmentBooking.owner, "-password");
    if (!user) return sendError(res, "Sorry, booking request owner not found");

    await apartmentBooking.save();

    const notifyUser = await saveNotification(
      apartmentBooking.owner,
      "booking",
      `Reservation for ${apartmentBooking.apartment_name} confirmed`,
      `Your reservation for a shortlet apartment; ${apartmentBooking.apartment_name} in ${apartmentBooking.address}, ${apartmentBooking.lga} has been successfully confirmed. Property is verified to be available. Please <a href="${process.env.USER_APP_URL}/stay-booking/${booking_reference}"> proceed to make payment</a>`,
      user
    );
    if (notifyUser) {
      return sendSuccess(res, "Successfully verified apartment's availability");
    }
  } catch (error) {
    console.log(err);
    return sendError(
      res,
      "Unable to complete your request. Something went wrong"
    );
  }
};

const declineShortletBooking = async (req, res) => {
  try {
    const apartmentBooking = await ShortletBooking.findById(req.params.id);
    if (apartmentBooking.apartment_owner !== req.id)
      return sendError(res, "Apartment is not owned by you!");
    if (apartmentBooking.status === "declined")
      return sendError(
        res,
        "Apartment's unavailability had already been confirmed!"
      );
    if (apartmentBooking.status === "confirmed")
      return sendError(
        res,
        "Apartment already confirmed to be available. Contact support for action."
      );
    if (!apartmentBooking)
      return sendError(res, "Such apartment post cannot be found!");

    apartmentBooking.status = "declined";

    const user = await User.findById(apartmentBooking.owner, "-password");
    if (!user) return sendError(res, "Sorry, booking request owner not found");

    await apartmentBooking.save();

    const notifyUser = await saveNotification(
      apartmentBooking.owner,
      "booking",
      `Apartment ${apartmentBooking.apartment_name} is unavailable`,
      `Your reservation for a shortlet apartment; ${apartmentBooking.apartment_name} in ${apartmentBooking.address}, ${apartmentBooking.lga} cannot continue due to unavailability. Please check for another apartment. Thank you for your understanding.`,
      user
    );
    if (notifyUser) {
      return sendSuccess(
        res,
        "Successfully verified apartment's unavailability"
      );
    }
  } catch (error) {
    console.log(err);
    return sendError(
      res,
      "Unable to complete your request. Something went wrong"
    );
  }
};

// fetchShortletBookings
const fetchShortletBookings = async (req, res) => {
  const userId = req.id;
  try {
    let bookings = await ShortletBooking.find();
    bookings = bookings.filter((book) => book.apartment_owner == userId);

    const pendingBookings = bookings.filter(
      (book) => book.status === "pending"
    );
    const declinedBookings = bookings.filter(
      (book) => book.status === "declined"
    );
    const confirmedBookings = bookings.filter(
      (book) => book.status === "confirmed"
    );
    const completedBookings = bookings.filter((book) => book.status === "paid");
    return sendSuccess(
      res,
      "Successfully fetched the requested shortlet apartment",
      {
        bookings,
        pendingBookings,
        declinedBookings,
        confirmedBookings,
        completedBookings,
      }
    );
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to fetch the requested shortlet apartment");
  }
};

const fetchSingleShortletBooking = async (req, res) => {
  try {
    const shortletBooking = await ShortletBooking.findById(req.params.id);
    if (!shortletBooking) {
      return sendSuccess(res, "No shortlet booking record found");
    }
    return sendSuccess(res, "Successfully fetched booking", shortletBooking);
  } catch (error) {
    return sendError(res, "Cannot fetch shortlet booking");
  }
};

// **
// **
// Profile Update
const updateHostProfile = async (req, res) => {
  const userId = req.id;
  try {
    const host = await Host.findByIdAndUpdate(
      userId,
      { $set: req.body },
      { new: true }
    );
    return sendSuccess(
      res,
      "Your profile data has been successfully updated",
      host
    );
  } catch (err) {
    console.log(err);
    return sendError(res, "Unable to update your profile data");
  }
};
const updateHostPassword = async (req, res, next) => {
  const userId = req.id;
  const { oldPassword, newPassword } = req.body;

  const host = await Host.findById(userId);
  if (!host) return sendError(res, "Invalid host profile");

  const isCurrentPasswordCorrect = bcrypt.compareSync(
    oldPassword,
    host.password
  );
  if (!isCurrentPasswordCorrect)
    return sendError(res, "Incorrect current password provided", 204);

  const isPasswordSame = bcrypt.compareSync(newPassword, host.password);
  if (isPasswordSame)
    return sendError(
      res,
      "New password must be different from the old password",
      205
    );

  const hashedPassword = bcrypt.hashSync(newPassword);
  host.password = hashedPassword;

  try {
    await host.save();
    req.body = {
      user: {
        first_name: host.contact_first_name,
        email: host.contact_email,
      },
    };
    next();
  } catch (error) {
    return sendError(res, "Cannot update your password");
  }
};
const setHostProfileAvatar = async (req, res) => {
  const userId = req.id;
  const rawImagesArray = req.files["avatar"];
  if (!rawImagesArray) {
    return badRequestError(res, "Please add the image avatar to be uploaded");
  }
  const namedImage = rawImagesArray.map((a) => a.filename);
  const stringnifiedImages = JSON.stringify(namedImage);
  const formmatedImages = stringnifiedImages.replace(/[^a-zA-Z0-9_.,]/g, "");
  const avatar = formmatedImages.replace(/[,]/g, ", ");
  console.log("avatar: ", avatar);

  try {
    // const host = await Host.findById()
    const savedHostProfile = await Host.findByIdAndUpdate(userId, {
      avatar: avatar,
    });
    return sendSuccess(
      res,
      "Successfully updated the profile avatar",
      savedHostProfile
    );
  } catch (err) {
    console.log(err);
    return sendError(res, "Unable to update the admin profile");
  }
};

// **
// **
// Auth
const isHostLogin = async (req, res) => {
  const cookies = req.headers.cookie;
  console.log("Session check cookie: ", cookies);
  if (cookies) {
    return res
      .status(200)
      .json({ success: true, message: "You are a logged in user" });
  } else if (!cookies) {
    return sendError(res, "No session found. You are not logged in");
  }
};

const logoutHost = (req, res, next) => {
  console.log("Logout api called");
  const cookies = req.headers.cookie;
  if (!cookies) {
    return sendError(
      res,
      "No cookie found.  You are never logged in to begin with",
      401
    );
  }
  const token = cookies.split("=")[1];
  console.log(token);
  if (!token) {
    return sendError(
      res,
      "No token found.  You are never logged in to begin with",
      401
    );
  }
  jwt.verify(String(token), process.env.JWT_HOST_SECRET_KEY, (err, host) => {
    if (err) {
      return sendError(res, "Invalid Token.", 401);
    }
    res.clearCookie(`${host.id}`);
    req.cookies[`${host.id}`] = "";
    return res
      .status(200)
      .json({ success: true, message: "Successfully logged out" });
  });
};

module.exports = {
  getHost,
  getHostNotifications,
  getHostReviews,

  addProperty,
  editProperty,
  getHostProperties,
  fetchSingleShortlet,

  fetchShortletBookings,
  fetchSingleShortletBooking,

  approveShortletBooking,
  declineShortletBooking,

  updateHostProfile,
  setHostProfileAvatar,
  updateHostPassword,

  isHostLogin,
  logoutHost,
};
