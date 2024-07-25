const { isValidObjectId } = require('mongoose');
const { sendError } = require('../utils/helpers');
const ResetPasswordToken = require('../models/user/ResetPasswordToken');
const Host = require('../models/host/Host');

const validateNewHost = async (req, res, next) => {
  const { first_name, last_name, email, phone, password } = req.body;
  const refinedEmail = email.toLowerCase();
  let existingEmail;
  let existingPhone;

  try {
    existingEmail = await Host.findOne({ email: refinedEmail });
  } catch (err) {
    console.log(err);
  }
  if (existingEmail) {
    return sendError(
      res,
      `Email is already associated with another account. Please login instead.`
    );
  }
  try {
    existingPhone = await Host.findOne({ phone: phone });
  } catch (err) {
    console.log(err);
  }
  if (existingPhone) {
    return sendError(
      res,
      `Phone number is already associated with another account. Please login instead.`
    );
  }
  req.body = {
    first_name,
    last_name,
    email,
    phone,
    password,
  };
  next();
};

const isHostPasswordResetTokenValid = async (req, res, next) => {
  const { token, id } = req.query;

  if (!token || !id) return sendError(res, 'Invalid request');

  if (!isValidObjectId(id)) return sendError(res, 'Invalid host id');

  const host = await Host.findById(id);

  if (!host) return sendError(res, 'Host account not found');

  const resToken = await ResetPasswordToken.findOne({ owner: host._id });
  if (!resToken) return sendError(res, 'Reset token not found');

  const resetToken = resToken.token;

  if (token !== resetToken) {
    return sendError(res, 'Password reset token is invalid');
  }

  req.body.host = host;
  next();
};

const validateHostLoginType = async (req, res, next) => {
  const { loginId, password } = req.body;

  let host;
  let hostIdentity;

  if (loginId.includes('@')) {
    hostIdentity = loginId.toLowerCase();
    try {
      host = await Host.findOne({
        $or: [{ hotel_email: hostIdentity }, { contact_email: hostIdentity }],
      });
    } catch (err) {
      return sendError(res, err.message, 500);
    }
    if (!host) {
      return sendError(res, 'Email not registered. Signup instead.');
    }
  } else if (loginId.charAt(0) === '+') {
    try {
      host = await Host.findOne({
        $or: [{ hotel_phone: loginId }, { contact_phone: loginId }],
      });
    } catch (err) {
      return sendError(res, err.message, 500);
    }
    if (!host) {
      return sendError(res, 'Phone number not registered. Signup instead.');
    }
  }

  req.body = {
    host,
    password,
  };

  next();
};

module.exports = {
  validateNewHost,
  isHostPasswordResetTokenValid,
  validateHostLoginType,
};
