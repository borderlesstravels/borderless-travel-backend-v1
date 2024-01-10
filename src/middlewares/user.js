const { isValidObjectId } = require('mongoose');
const { sendError } = require('../utils/helpers');
const User = require('../models/user/User');
const ResetPasswordToken = require('../models/user/ResetPasswordToken');

const validateNewUser = async (req, res, next) => {
  const { name, email, password, referred_by } = req.body;
  const refinedEmail = email.toLowerCase();
  let existingUser;

  try {
    existingUser = await User.findOne({ email: refinedEmail });
  } catch (err) {
    console.log(err);
  }
  if (existingUser) {
    return sendError(res, 'Email already exists. Please login instead.');
  }
  req.body = {
    name,
    email: refinedEmail,
    password,
    referred_by,
  };
  next();
};

const isPasswordResetTokenValid = async (req, res, next) => {
  const { token, id } = req.query;

  if (!token || !id) return sendError(res, 'Invalid request');

  if (!isValidObjectId(id)) return sendError(res, 'Invalid user');

  const user = await User.findById(id);

  if (!user) return sendError(res, 'User not found');

  const resToken = await ResetPasswordToken.findOne({ owner: user._id });
  if (!resToken) return sendError(res, 'Reset token not found');

  const resetToken = resToken.token;

  if (token !== resetToken) {
    return sendError(res, 'Reset token is invalid');
  }

  req.body.user = user;
  next();
};

const validateLoginType = async (req, res, next) => {
  const { loginId, password } = req.body;

  let user;
  let userIdentity;

  if (loginId.includes('@')) {
    userIdentity = loginId.toLowerCase();
    try {
      user = await User.findOne({ email: userIdentity });
    } catch (err) {
      return sendError(res, err.message, 500);
    }
    if (!user) {
      return sendError(res, 'Email not registered. Signup instead.');
    }
  } else if (loginId.charAt(0) === '+') {
    try {
      user = await User.findOne({ phone: loginId });
    } catch (err) {
      return sendError(res, err.message, 500);
    }
    if (!user) {
      return sendError(res, 'Phone number not registered. Signup instead.');
    }
  } else {
    userIdentity = loginId.toLowerCase();
    try {
      user = await User.findOne({ username: userIdentity });
    } catch (err) {
      return sendError(res, err.message, 500);
    }
    if (!user) {
      return sendError(res, 'Username not registered. Signup instead.');
    }
  }

  req.body = {
    user,
    password,
  };

  next();
};

module.exports = {
  validateNewUser,
  isPasswordResetTokenValid,
  validateLoginType,
};
