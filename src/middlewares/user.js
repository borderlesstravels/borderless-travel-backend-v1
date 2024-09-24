const { isValidObjectId } = require('mongoose');
const { sendError, sendLoginError } = require('../utils/helpers');
const User = require('../models/user/User');
const ResetPasswordToken = require('../models/user/ResetPasswordToken');

const validateNewUser = async (req, res, next) => {
  const { first_name, last_name, email, password, referred_by } = req.body;
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
    first_name,
    last_name,
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

  if (!loginId) {
    return sendLoginError(res, 'loginId is missing', 1);
  }

  if (loginId.includes('@')) {
    userIdentity = loginId.toLowerCase();
    try {
      user = await User.findOne({ email: userIdentity });
    } catch (err) {
      return sendLoginError(res, err.message, 1, 500);
    }
    if (!user) {
      return sendLoginError(res, 'Email not registered. Signup instead.', 1);
    }
  } else if (loginId.charAt(0) === '+') {
    try {
      user = await User.findOne({ phone: loginId });
    } catch (err) {
      return sendLoginError(res, err.message, 1, 500);
    }
    if (!user) {
      return sendLoginError(res, 'Phone number not registered. Signup instead.', 0);
    }
  } else {
    userIdentity = loginId.toLowerCase();
    try {
      user = await User.findOne({ username: userIdentity });
    } catch (err) {
      return sendLoginError(res, err.message, 1, 500);
    }
    if (!user) {
      return sendLoginError(res, 'Username not registered. Signup instead.', 0);
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
