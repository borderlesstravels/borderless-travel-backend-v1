const User = require("../../models/user/User");
const {
  sendError,
  sendSuccess,
  badRequestError,
} = require("../../utils/helpers");
const UserReferral = require("../../models/user/UserReferral");
const bcrypt = require("bcryptjs");
const FlightBooking = require("../../models/general/FlightBooking");
const ShortletBooking = require("../../models/general/ShortletBooking");
const Review = require("../../models/general/Review");
const Notification = require("../../models/general/Notification");
const ShortLet = require("../../models/host/ShortLet");

const getUser = async (req, res) => {
  const userId = req.id;
  let user;
  try {
    user = await User.findById(userId, "-password");
  } catch (err) {
    return sendError(res, err.message);
  }
  if (!user) {
    return sendError(res, "User not found");
  }
  return sendSuccess(res, null, user);
};

const updateUserProfile = async (req, res) => {
  const userId = req.id;
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: req.body },
      { new: true }
    );
    return sendSuccess(
      res,
      "Your profile contact data has been successfully updated",
      user
    );
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to update your profile data");
  }
};

const setUserProfileAvatar = async (req, res) => {
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
    const savedProfile = await User.findByIdAndUpdate(userId, {
      avatar: avatar,
    });
    return sendSuccess(
      res,
      "Successfully updated the profile avatar",
      savedProfile
    );
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to update the admin profile");
  }
};

const updateUserPassword = async (req, res, next) => {
  const userId = req.id;
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return sendError(res, "Invalid user profile");
  }

  const isCurrentPasswordCorrect = bcrypt.compareSync(
    oldPassword,
    user.password
  );
  if (!isCurrentPasswordCorrect) {
    return sendError(res, "Incorrect current password provided");
  }

  const isPasswordSame = bcrypt.compareSync(newPassword, user.password);
  if (isPasswordSame) {
    return sendError(
      res,
      "New password must be different from the old password"
    );
  }

  const hashedPassword = bcrypt.hashSync(newPassword);
  user.password = hashedPassword;

  try {
    await user.save();
    req.body = {
      user,
    };
    next();
  } catch (error) {
    console.log(error);
    return sendError(res, error);
  }
};

const updateUserEmailAlert = async (req, res) => {
  const userId = req.id;
  try {
    const user = await User.findByIdAndUpdate(userId, { $set: req.body });
    return sendSuccess(res, "You have updated your alert settings", user);
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to update your alert settings");
  }
};

const getReferralProfile = async (req, res) => {
  const userId = req.id;
  let userReferrals;
  try {
    userReferrals = await UserReferral.findOne({ userId });
    if (!userReferrals) {
      return sendError(res, "User not found");
    }
    return sendSuccess(res, "Successfully fetched data", userReferrals);
  } catch (error) {
    return sendError(res, error.message);
  }
};

const userFlightBookings = async (req, res) => {
  const userId = req.id;
  try {
    const flightBookings = await FlightBooking.find({ owner: userId })
      .select("-action_by")
      .limit(req.query.limit);
    if (flightBookings.length < 1) {
      return sendSuccess(res, "No flight booking record found");
    }
    console.log(flightBookings);
    return sendSuccess(
      res,
      "Successfully fetched your flight bookings",
      flightBookings
    );
  } catch (error) {
    return sendError(res, "Cannot fetch flight bookings");
  }
};

const userSingleFlightBooking = async (req, res) => {
  try {
    const flightBooking = await FlightBooking.findById(req.params.id).select(
      "-action_by"
    );
    if (!flightBooking) {
      return sendSuccess(res, "No flight booking record found");
    }
    return sendSuccess(res, "Successfully fetched booking", flightBooking);
  } catch (error) {
    return sendError(res, "Cannot fetch flight bookings");
  }
};

const userShortletBookings = async (req, res) => {
  const userId = req.id;
  try {
    const shortletBookings = await ShortletBooking.find({
      owner: userId,
    }).limit(req.query.limit);
    if (shortletBookings.length < 1) {
      return sendSuccess(res, "No shortlet booking record found");
    }
    console.log(shortletBookings);
    return sendSuccess(
      res,
      "Successfully fetched your shortlet bookings",
      shortletBookings
    );
  } catch (error) {
    return sendError(res, "Cannot fetch shortlet bookings");
  }
};

const userSingleShortletBooking = async (req, res) => {
  try {
    const shortletBooking = await ShortletBooking.findById(req.params.id);
    if (!shortletBooking) {
      return sendSuccess(res, "No shortlet booking record found");
    }
    return sendSuccess(res, "Successfully fetched booking", shortletBooking);
  } catch (error) {
    return sendError(res, "Cannot fetch shortlet bookings");
  }
};

const createReview = async (req, res) => {
  const user = await User.findById(req.id, "-password");
  if (!user) {
    return sendError(res, "Sorry, please login first");
  }
  const { product_reviewed } = req.params;
  const { product_type, review, rating } = req.body;
  let property_owner;
  if (product_type === "shortlet") {
    const productRev = await ShortLet.findById(product_reviewed);
    if (productRev) {
      property_owner = productRev.owner;
    }
  } else {
    property_owner = "";
  }
  const newReview = new Review({
    reviewer_id: req.id,
    reviewer_name: `${user.first_name} ${user.last_name}`,
    product_reviewed: product_reviewed,
    property_owner: property_owner,
    review: review,
    rating: rating,
  });
  try {
    await newReview.save();
    return sendSuccess(res, "Successfully added your review", newReview);
  } catch (error) {
    return sendError(res, "Cannot fetch shortlet bookings");
  }
};

const updateReview = async (req, res) => {
  try {
    const user = await Review.findByIdAndUpdate(
      req.params.review_id,
      { $set: req.body },
      { new: true }
    );
    return sendSuccess(res, "Your review has been successfully updated", user);
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to update your review");
  }
};

const deleteReview = async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    return sendSuccess(res, "Successfully deleted a review record");
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to delete the user profile");
  }
};

const userReviews = async (req, res) => {
  const userId = req.id;
  try {
    const reviews = await Review.find({
      owner: userId,
    }).limit(req.query.limit);
    if (reviews.length < 1) {
      return sendSuccess(res, "No review record found");
    }
    return sendSuccess(res, "Successfully fetched your reviews", reviews);
  } catch (error) {
    return sendError(res, "Cannot fetch reviews");
  }
};

const getUserNotifications = async (req, res) => {
  const userId = req.id;
  try {
    const notifications = await Notification.find();
    if (!notifications.length) {
      return sendSuccess(res, "No notifications record yet");
    }
    const userNotifications = notifications.filter(
      (item) => item.owner == userId
    );
    if (!userNotifications.length) {
      return sendSuccess(res, "You have no notifications at this time");
    }
    return sendSuccess(res, "Successfully fetched data", userNotifications);
  } catch (error) {
    console.log("error", error);
    return sendError(res, "Cannot fetch user's notifications", 500);
  }
};

module.exports = {
  getUser,
  updateUserProfile,
  setUserProfileAvatar,
  updateUserPassword,
  updateUserEmailAlert,

  getReferralProfile,

  userFlightBookings,
  userSingleFlightBooking,

  userShortletBookings,
  userSingleShortletBooking,

  createReview,
  updateReview,
  deleteReview,
  userReviews,
  getUserNotifications,
};
