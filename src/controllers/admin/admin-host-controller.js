const bcrypt = require("bcryptjs");
const { sendError, sendSuccess } = require("../../utils/helpers");
const { log } = require("console");
const Host = require("../../models/host/Host");

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
    }).limit(req.query.limit);
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

module.exports = {
  updateHostProfile,
  blockHost,
  unblockHost,
  deleteHost,
  fetchAllHosts,
  fetchSingleHost,
};
