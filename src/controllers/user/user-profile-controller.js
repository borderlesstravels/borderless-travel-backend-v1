const User = require('../../models/user/User');
const { sendError, sendSuccess, badRequestError } = require('../../utils/helpers');
const UserReferral = require('../../models/user/UserReferral');
const bcrypt = require('bcryptjs');
const FlightBooking = require('../../models/general/FlightBooking');

const getUser = async (req, res) => {
  const userId = req.id;
  let user;
  try {
    user = await User.findById(userId, '-password');
  } catch (err) {
    return sendError(res, err.message);
  }
  if (!user) {
    return sendError(res, 'User not found');
  }
  return sendSuccess(res, null, user);
};

const updateUserProfile = async (req, res) => {
  const userId = req.id;
  try {
    const user = await User.findByIdAndUpdate(userId, { $set: req.body }, { new: true });
    return sendSuccess(res, 'Your profile contact data has been successfully updated', user);
  } catch (error) {
    console.log(err);
    return sendError(res, 'Unable to update your profile data');
  }
};

const setUserProfileAvatar = async (req, res) => {
  const rawImagesArray = req.files['avatar'];
  if (!rawImagesArray) {
    return badRequestError(res, 'Please add the image avatar to be uploaded');
  }
  const namedImage = rawImagesArray.map((a) => a.filename);
  const stringnifiedImages = JSON.stringify(namedImage);
  const formmatedImages = stringnifiedImages.replace(/[^a-zA-Z0-9_.,]/g, '');
  const avatar = formmatedImages.replace(/[,]/g, ', ');
  console.log('avatar: ', avatar);

  try {
    const savedProfile = await User.findByIdAndUpdate(req.params.id, {
      avatar: avatar,
    });
    return sendSuccess(res, 'Successfully updated the profile avatar', savedProfile);
  } catch (err) {
    console.log(err);
    return sendError(res, 'Unable to update the admin profile');
  }
};

const updateUserPassword = async (req, res, next) => {
  const userId = req.id;
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(userId);
  if (!user) return sendError(res, 'Invalid user profile');

  const isCurrentPasswordCorrect = bcrypt.compareSync(oldPassword, user.password);
  if (!isCurrentPasswordCorrect) return sendError(res, 'Incorrect current password provided');

  const isPasswordSame = bcrypt.compareSync(newPassword, user.password);
  if (isPasswordSame) return sendError(res, 'New password must be different from the old password');

  const hashedPassword = bcrypt.hashSync(newPassword);
  user.password = hashedPassword;

  try {
    await user.save();
    req.body = {
      user,
    };
    next();
  } catch (error) {
    console.log(err);
    return sendError(res, err);
  }
};

const updateUserEmailAlert = async (req, res) => {
  const userId = req.id;
  try {
    const user = await User.findByIdAndUpdate(userId, { $set: req.body });
    return sendSuccess(res, 'You have updated your alert settings', user);
  } catch (error) {
    console.log(err);
    return sendError(res, 'Unable to update your alert settings');
  }
};

const getReferralProfile = async (req, res) => {
  const userId = req.id;
  let userReferrals;
  try {
    userReferrals = await UserReferral.findOne({ userId });
  } catch (err) {
    return sendError(res, err.message);
  }
  if (!userReferrals) {
    return sendError(res, 'User not found');
  }
  return sendSuccess(res, null, userReferrals);
};

const userFlightBookings = async (req, res) => {
  const userId = req.id;
  try {
    const flightBookings = await FlightBooking.find({ owner: userId })
      .select('-action_by')
      .limit(req.query.limit);
    if (flightBookings.length < 1) {
      return sendSuccess(res, 'No flight booking record found');
    }
    console.log(flightBookings);
    return sendSuccess(res, 'Successfully fetched your flight bookings', flightBookings);
  } catch (error) {
    return sendError(res, 'Cannot fetch flight bookings');
  }
};

const userSingleFlightBooking = async (req, res) => {
  try {
    const flightBooking = await FlightBooking.findById(req.params.id).select('-action_by');
    if (!flightBooking) {
      return sendSuccess(res, 'No flight booking record found');
    }
    return sendSuccess(res, 'Successfully fetched booking', flightBooking);
  } catch (error) {
    return sendError(res, 'Cannot fetch flight bookings');
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
};
