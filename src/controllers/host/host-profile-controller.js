const Host = require("../../models/host/Host");
const { sendError, sendSuccess } = require("../../utils/helpers");
const bcrypt = require("bcryptjs");
const Review = require("../../models/general/Review");
const Notification = require("../../models/general/Notification");
const {
  getSessionToken,
  verifyLoginSession,
  uploadSingleImage,
} = require("../../middlewares/general");
const SessionStore = require("../../models/general/SessionStore");
const HostEarning = require("../../models/host/HostEarning");
const HostWithdrawal = require("../../models/host/HostWithdrawal");
const HostBalance = require("../../models/host/HostBalance");
const HostBankAccount = require("../../models/host/HostBankAccount");

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
    const reviews = await Review.find({ property_owner: userId });
    return sendSuccess(res, "Successfully fetched data", reviews);
  } catch (error) {
    console.log("error", error);
    return sendError(res, "Cannot fetch host's reviews", 500);
  }
};

// **
// **
// Earnings and withdrawals
const getHostBalances = async (req, res) => {
  const userId = req.id;
  try {
    const balances = await HostBalance.findOne({ owner: userId });
    return sendSuccess(res, "Successfully fetched data", balances);
  } catch (error) {
    console.log("error", error);
    return sendError(res, "Cannot fetch host's balances", 500);
  }
};

const getHostEarnings = async (req, res) => {
  const userId = req.id;
  try {
    const earnings = await HostEarning.find({ owner: userId });
    return sendSuccess(res, "Successfully fetched data", earnings);
  } catch (error) {
    console.log("error", error);
    return sendError(res, "Cannot fetch host's earnings", 500);
  }
};

const getHostWithdrawals = async (req, res) => {
  const userId = req.id;
  try {
    const withdrawals = await HostWithdrawal.find({ owner: userId });
    return sendSuccess(res, "Successfully fetched data", withdrawals);
  } catch (error) {
    console.log("error", error);
    return sendError(res, "Cannot fetch host's withdrawals", 501);
  }
};

const makeWithdrawal = async (req, res) => {
  const { amount, bank_details } = req.body;
  const userId = req.id;
  try {
    const hostBalAcc = await HostBalance.findOne({ owner: userId });
    if (!hostBalAcc) {
      return sendError(res, "Unable to verify balance");
    } else {
      const hostAvailableBal = hostBalAcc.available_balance;
      if (amount > hostAvailableBal) {
        return sendError(
          res,
          "Amount provided is more than your available balance"
        );
      }
      const newWithdrawal = new HostWithdrawal({
        owner: userId,
        amount,
        bank_details,
      });

      hostBalAcc.available_balance = hostAvailableBal - amount;

      await newWithdrawal.save();
      await hostBalAcc.save();
      return sendSuccess(
        res,
        "Successfully submitted your withdrawal request. Kindly wait while we process your request",
        newWithdrawal
      );
    }
  } catch (error) {
    console.log("error", error);
    return sendError(res, "Unable to complete withdrawal request", 501);
  }
};

const addBankDetails = async (req, res) => {
  const { account_name, account_number, bank_data } = req.body;
  const userId = req.id;
  try {
    const exixtingAccs = await HostBankAccount.find({ owner: userId });

    const accountExists = exixtingAccs.filter(
      (ele) =>
        ele.account_name.toLowerCase() === account_name.toLowerCase() &&
        ele.bank_data.toLowerCase() === bank_data.toLowerCase() &&
        ele.account_number === account_number
    );
    console.log("accountExists", accountExists);
    if (accountExists.length > 0) {
      return sendError(res, "Account details already exists");
    }

    const newBankDetails = new HostBankAccount({
      owner: userId,
      account_name,
      account_number,
      bank_data,
    });
    await newBankDetails.save();
    return sendSuccess(
      res,
      "Successfully added a new bank details",
      newBankDetails
    );
  } catch (error) {
    console.log("error", error);
    return sendError(res, "Unable to complete withdrawal request", 501);
  }
};

const getHostBankDetails = async (req, res) => {
  const userId = req.id;
  try {
    const bankDetails = await HostBankAccount.find({ owner: userId });
    return sendSuccess(res, "Successfully fetched data", bankDetails);
  } catch (error) {
    console.log("error", error);
    return sendError(res, "Cannot fetch host's bank details", 501);
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
    return badRequestError(res, "Please add the image avatar to be uploaded");
  }

  try {
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

  getHostBalances,
  getHostEarnings,
  getHostWithdrawals,
  makeWithdrawal,
  addBankDetails,
  getHostBankDetails,

  updateHostProfile,
  setHostProfileAvatar,
  updateHostPassword,

  isHostLogin,
  logoutHost,
};
