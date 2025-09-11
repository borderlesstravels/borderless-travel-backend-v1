const bcrypt = require("bcryptjs");
const {
  sendError,
  sendSuccess,
  dateFormatter,
} = require("../../utils/helpers");
const { log } = require("console");
const Host = require("../../models/host/Host");
const ShortLet = require("../../models/host/ShortLet");
const Review = require("../../models/general/Review");
const ShortletBooking = require("../../models/general/ShortletBooking");
const HostWithdrawal = require("../../models/host/HostWithdrawal");
const HostBalance = require("../../models/host/HostBalance");
const Notification = require("../../models/general/Notification");

const updateHostProfile = async (req, res) => {
  if (req.body.password) {
    req.body.password = bcrypt.hashSync(req.body.password);
  }
  try {
    const savedHostProfile = await Host.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    return sendSuccess(
      res,
      "Successfully updated the host profile",
      savedHostProfile
    );
  } catch (err) {
    console.log(err);
    return sendError(res, "Unable to update the host profile");
  }
};

const blockHost = async (req, res) => {
  try {
    const host = await Host.findById(req.params.id);
    if (!host) {
      return badRequestError(res, "Unable to verify host details");
    }
    if (host.status === "Blocked") {
      return badRequestError(
        res,
        `${host.first_name} ${host.last_name}'s account is already blocked`
      );
    }
    host.status = "Blocked";
    await host.save();
    return sendSuccess(
      res,
      `Host ${host.first_name} ${host.last_name} has been blocked`
    );
  } catch (err) {
    log(err);
    return sendError(res, "Unable to block the host account");
  }
};

const unblockHost = async (req, res) => {
  let status;
  try {
    const host = await Host.findById(req.params.id);
    if (!host) {
      return badRequestError(res, "Unable to verify host details");
    }
    if (host.status === "Pending" || host.status === "Active") {
      return badRequestError(
        res,
        `host ${host.first_name} ${host.last_name}'s account was not blocked`
      );
    }
    if (host.email_verified) {
      status = "Active";
    } else {
      status = "Pending";
    }
    host.status = status;
    await host.save();
    return sendSuccess(
      res,
      `Host ${host.first_name} ${host.last_name} is now active`
    );
  } catch (err) {
    log(err);
    return sendError(res, "Unable to block the host account");
  }
};

const deleteHost = async (req, res) => {
  try {
    await Host.findByIdAndDelete(req.params.id);
    return sendSuccess(res, "Successfully deleted the host profile");
  } catch (err) {
    console.log(err);
    return sendError(res, "Unable to delete the host profile");
  }
};

const fetchAllHosts = async (req, res) => {
  const { ...others } = req.query;
  try {
    const hosts = await Host.find({
      ...others,
    })
      .sort({ _id: "desc" })
      .limit(req.query.limit);
    return sendSuccess(res, "Hosts fetched", hosts);
  } catch (error) {
    return sendError(res, "Unable to fetch the hosts data");
  }
};

const fetchSingleHost = async (req, res, next) => {
  const { id } = req.params;
  try {
    const host = await Host.findById(id);
    if (!host) {
      return sendError(res, "Host profile does not exist");
    }
    return sendSuccess(res, "Host account fetched", host);
  } catch (error) {
    return sendError(res, "Unable to fetch the host profile data");
  }
};

const getHostProperties = async (req, res) => {
  try {
    const hostProperties = await ShortLet.find({ owner: req.params.id })
      .sort({ _id: "desc" })
      .limit(req.query.limit);
    return sendSuccess(
      res,
      "Successfully fetched host's properties",
      hostProperties
    );
  } catch (error) {
    console.log("error", error);
    return sendError(res, "Cannot fetch host's listings", 500);
  }
};

const getHostReviewsForAProperty = async (req, res) => {
  try {
    const hostReviewws = await Review.find({ product_reviewed: req.params.id })
      .sort({ _id: "desc" })
      .limit(req.query.limit);
    return sendSuccess(
      res,
      "Successfully fetched host's property's reviews",
      hostReviewws
    );
  } catch (error) {
    console.log("error", error);
    return sendError(res, "Cannot fetch host's property's reviews", 500);
  }
};

const getHostBookingsForAProperty = async (req, res) => {
  try {
    const hostPropertyBookings = await ShortletBooking.find({
      apartment_id: req.params.id,
    })
      .sort({ _id: "desc" })
      .limit(req.query.limit);
    return sendSuccess(
      res,
      "Successfully fetched host's property's bookings",
      hostPropertyBookings
    );
  } catch (error) {
    console.log("error", error);
    return sendError(res, "Cannot fetch host's property's bookings", 500);
  }
};

const getWithdrawalRequests = async (req, res) => {
  try {
    const withdrawalRequests = await HostWithdrawal.find()
      .sort({ _id: "desc" })
      .limit(req.query.limit);
    return sendSuccess(res, "Successfully fetched data", withdrawalRequests);
  } catch (error) {
    console.log("error", error);
    return sendError(res, "Cannot fetch withdrawal requests", 501);
  }
};

const rejectWithdrawalRequest = async (req, res) => {
  const adminId = req.id;
  const { reason } = req.body;
  try {
    const request = await HostWithdrawal.findById(req.params.id);
    if (request.status === "rejected") {
      return sendError(res, "Request already rejected");
    }
    request.status = "rejected";
    request.action_by = adminId;
    // Return amount back to host earning balance

    const hostBalAcc = await HostBalance.findOne({ owner: request.owner });
    if (!hostBalAcc) {
      return sendError(res, "Unable to verify balance");
    } else {
      const hostAvailableBal = hostBalAcc.available_balance;
      hostBalAcc.available_balance = hostAvailableBal + request.amount;
      await hostBalAcc.save();
      await request.save();

      const notifyUser = new Notification({
        owner: request.owner,
        type: "booking",
        title: `Your withdrawal request of ${request.amount} was rejected`,
        description: `Your withdrawal request of ${
          request.amount
        } made on ${dateFormatter(
          request.created_at
        )} has been declined. Reason: ${reason}`,
        apartment_id,
        booking_id: newBooking._id,
      });
      await notifyUser.save();
      return sendSuccess(res, "Action is successful!", request);
    }
  } catch (error) {
    console.log("error", error);
    return sendError(res, "Cannot fetch withdrawal requests", 501);
  }
};

const completeWithdrawalRequest = async (req, res) => {
  const adminId = req.id;
  try {
    const request = await HostWithdrawal.findById(req.params.id);
    if (request.status === "rejected") {
      return sendError(res, "Request already rejected");
    }
    request.status = "rejected";
    request.action_by = adminId;

    const notifyUser = new Notification({
      owner: request.owner,
      type: "booking",
      title: `Your withdrawal request of ${request.amount} was approved`,
      description: `Your withdrawal request of ${
        request.amount
      } made on ${dateFormatter(
        request.created_at
      )} has been approved. Kindly check your bank account to see the new balance.`,
      apartment_id,
      booking_id: newBooking._id,
    });
    await request.save();
    await notifyUser.save();
    return sendSuccess(res, "Action is successful!", request);
  } catch (error) {
    console.log("error", error);
    return sendError(res, "Cannot fetch withdrawal requests", 501);
  }
};

module.exports = {
  updateHostProfile,
  blockHost,
  unblockHost,
  deleteHost,
  fetchAllHosts,
  fetchSingleHost,

  getHostProperties,
  getHostReviewsForAProperty,
  getHostBookingsForAProperty,

  getWithdrawalRequests,
  rejectWithdrawalRequest,
  completeWithdrawalRequest,
};
