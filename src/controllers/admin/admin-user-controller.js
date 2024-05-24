const bcrypt = require('bcryptjs');
const { sendError, sendSuccess, badRequestError } = require('../../utils/helpers');
const { log } = require('console');
const User = require('../../models/user/User');
const ShortStayBooking = require('../../models/ShortStayBooking');
const FlightBooking = require('../../models/general/FlightBooking');

const updateUserProfile = async (req, res) => {
  if (req.body.password) {
    req.body.password = bcrypt.hashSync(req.body.password);
  }
  try {
    const savedUserProfile = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      message: 'Successfully updated the user profile',
      data: savedUserProfile,
    });
  } catch (err) {
    log(err);
    return sendError(res, 'Unable to update the user profile');
  }
};

const blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return badRequestError(res, 'Unable to verify user details');
    }
    if (user.status === 'Blocked') {
      return badRequestError(
        res,
        `${user.first_name} ${user.last_name}'s account is already blocked`
      );
    }
    user.status = 'Blocked';
    await user.save();
    return sendSuccess(res, `User ${user.first_name} ${user.last_name} has been blocked`);
  } catch (err) {
    log(err);
    return sendError(res, 'Unable to block the user account');
  }
};

const unblockUser = async (req, res) => {
  let status;
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return badRequestError(res, 'Unable to verify user details');
    }
    if (user.status === 'Pending' || user.status === 'Active') {
      return badRequestError(
        res,
        `User ${user.first_name} ${user.last_name}'s account was not blocked`
      );
    }
    if (user.email_verified) {
      status = 'Active';
    } else {
      status = 'Pending';
    }
    user.status = status;
    await user.save();
    return sendSuccess(res, `User ${user.first_name} ${user.last_name} is now active`);
  } catch (err) {
    log(err);
    return sendError(res, 'Unable to block the user account');
  }
};

const fetchUserFlightBookings = async (req, res) => {
  console.log('flightBookings');
  try {
    const flightBookings = await FlightBooking.find({ owner: req.params.id });
    if (flightBookings.length < 1) {
      return sendSuccess(res, 'User has no Flight bookings yet', flightBookings);
    }
    return sendSuccess(res, null, flightBookings);
  } catch (error) {
    return sendError(res, "Unable to fetch the user's Flight Bookings");
  }
};
const fetchUserShortStayBookings = async (req, res) => {
  try {
    const shortStayBookings = await ShortStayBooking.find({ owner: req.params.id });
    if (shortStayBookings.length < 1) {
      return sendSuccess(res, 'User has no Short Stay bookings yet', shortStayBookings);
    }
    return sendSuccess(res, null, shortStayBookings);
  } catch (error) {
    return sendError(res, "Unable to fetch the user's Short Stay bookings");
  }
};

const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Successfully deleted the user profile',
    });
  } catch (err) {
    console.log(err);
    return sendError(res, 'Unable to delete the user profile');
  }
};

const fetchAllUsers = async (req, res) => {
  try {
    const users = await User.find().limit(req.query.limit);
    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    return sendError(res, 'Unable to fetch the users data');
  }
};

const fetchSingleUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) {
      return sendError(res, 'User profile does not exist');
    }
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return sendError(res, 'Unable to fetch the user profile data');
  }
};

module.exports = {
  updateUserProfile,
  blockUser,
  unblockUser,
  deleteUser,
  fetchUserFlightBookings,
  fetchUserShortStayBookings,
  fetchAllUsers,
  fetchSingleUser,
};
