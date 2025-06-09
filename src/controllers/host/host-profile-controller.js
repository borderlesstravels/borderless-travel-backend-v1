const jwt = require("jsonwebtoken");
const Host = require("../../models/host/Host");
const {
  sendError,
  sendSuccess,
  saveNotification,
} = require("../../utils/helpers");
const bcrypt = require("bcryptjs");
const Review = require("../../models/general/Review");
const Notification = require("../../models/general/Notification");
const {
  getSessionToken,
  logoutSession,
  verifyLoginSession,
  uploadSingleImage,
  uploadMultipleImages,
} = require("../../middlewares/general");
const SessionStore = require("../../models/general/SessionStore");

const getHost = async (req, res) => {
  const userId = req.id;
  let host;
  try {
    host = await Host.findById(userId, "-password");
    if (!host) {
      return sendError(res, "Profile not found");
    }
    return sendSuccess(res, "Successfully fetched data", host);
  } catch (error) {
    console.log("error", error);
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
  } catch (error) {
    console.log("error", error);
    return sendError(res, "Cannot fetch host's notifications", 500);
  }
};

const openNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return sendSuccess(res, "Invalid notification id supplied");
    }
    notification.status = "opened";
    await notification.save();
    return sendSuccess(res, "Notificationed attended to", notification);
  } catch (error) {
    console.log("error", error);
    return sendError(
      res,
      `Cannot fetch host's notifications. Error - ${error}`,
      500
    );
  }
};

const getHostReviews = async (req, res) => {
  const userId = req.id;
  try {
    const reviews = await Review.find();
    if (!reviews.length) {
      return sendSuccess(res, "No reviews record yet");
    }
    console.log({ reviews });
    const hostReviews = reviews.filter((item) => item.property_owner == userId);
    if (!hostReviews.length) {
      return sendSuccess(res, "You have no reviews yet");
    }
    return sendSuccess(res, "Successfully fetched data", hostReviews);
  } catch (error) {
    console.log("error", error);
    return sendError(res, "Cannot fetch host's reviews", 500);
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
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to update your profile data");
  }
};

const updateHostPassword = async (req, res, next) => {
  const userId = req.id;
  const { oldPassword, newPassword } = req.body;

  const host = await Host.findById(userId);
  if (!host) {
    return sendError(res, "Invalid host profile");
  }

  const isCurrentPasswordCorrect = bcrypt.compareSync(
    oldPassword,
    host.password
  );
  if (!isCurrentPasswordCorrect) {
    return sendError(res, "Incorrect current password provided", 204);
  }

  const isPasswordSame = bcrypt.compareSync(newPassword, host.password);
  if (isPasswordSame) {
    return sendError(
      res,
      "New password must be different from the old password",
      205
    );
  }

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
  const avatar = await uploadSingleImage(req, res);
  if (!avatar) {
    return sendError(res, "Please add the image avatar to be uploaded");
  }

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
  } catch (error) {
    console.log(error);
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

const logoutHost = async (req, res) => {
  const tokenKey = req.headers["u-x-key"];
  try {
    if (!tokenKey) {
      return sendError(res, "Unauthorised. No headers key");
    }
    const sessionToken = await getSessionToken(String(tokenKey));
    if (!sessionToken) {
      return sendSuccess(res, "Session already expired");
    }
    if (sessionToken) {
      const token = sessionToken.value;
      const checkSession = await verifyLoginSession(
        token,
        process.env.JWT_HOST_SECRET_KEY,
        req
      );
      if (checkSession) {
        const deleteData = await SessionStore.findByIdAndDelete(
          sessionToken._id
        );
        console.log("deleteData", deleteData);
        if (deleteData) {
          return sendSuccess(res, "Successfully logged out");
        }
        return sendError(res, `Unable to log you out now`);
      }
    }
  } catch (error) {
    return sendError(res, `Something went wrong - ${error}`);
  }
};

module.exports = {
  getHost,
  getHostNotifications,
  openNotification,
  getHostReviews,

  updateHostProfile,
  setHostProfileAvatar,
  updateHostPassword,

  isHostLogin,
  logoutHost,
};
