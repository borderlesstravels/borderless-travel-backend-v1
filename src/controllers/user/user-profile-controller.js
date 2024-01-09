const User = require('../../models/user/User');
const { sendError } = require('../../utils/helpers');
const UserReferral = require('../../models/user/UserReferral');
const bcrypt = require('bcryptjs');

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
  return res.status(200).json({
    success: true,
    data: user,
  });
};

const updateUserProfile = async (req, res, next) => {
  const userId = req.id;
  const { name } = req.body;

  const user = await User.findById(userId);
  if (!user) return sendError(res, 'Invalid user profile');

  user.name = name;
  try {
    await user.save();
    return res.status(200).json({
      success: true,
      message: 'Profile successfully updated',
    });
  } catch (error) {
    console.log(err);
    return sendError(res, err);
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
  return res.status(200).json({
    success: true,
    data: userReferrals,
  });
};

const withdrawReferralEarning = async (req, res, next) => {
  const userId = req.id;
  const { amount } = req.body;

  let referralData;
  let userBalance;

  const user = await User.findById(userId);
  if (!user) return sendError(res, 'Invalid user profile');

  try {
    referralData = await UserReferral.findOne({ userId });
  } catch (err) {
    console.log(err);
  }

  try {
    userBalance = await UserBalance.findOne({ owner: userId, ticker: 'NGN' });
  } catch (err) {
    console.log(err);
  }

  const pendingBalance = referralData.pendingBalance;
  const fiatBalance = userBalance.balance;
  if (pendingBalance <= amount) return sendError(res, 'Enter an amount lower than your balance');

  const newPendingBalance = pendingBalance - amount;
  const newfiatBalance = fiatBalance + amount;

  referralData.pendingBalance = newPendingBalance;
  userBalance.balance = newfiatBalance;
  try {
    await referralData.save();
    await userBalance.save();
    req.body = { user, amount };
    next();
  } catch (error) {
    console.log(err);
    return sendError(res, err);
  }
};

module.exports = {
  getUser,
  updateUserProfile,
  updateUserPassword,

  getReferralProfile,
  withdrawReferralEarning,
};
