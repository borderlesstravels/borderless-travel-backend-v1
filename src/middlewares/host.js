const { isValidObjectId } = require('mongoose');
const { sendError } = require('../utils/helpers');
const ResetPasswordToken = require('../models/user/ResetPasswordToken');
const Host = require('../models/host/Host');

const validateNewHost = async (req, res, next) => {
  const {
    hotel_name,
    country,
    state,
    city,
    lga,
    postal_code,
    hotel_address,
    hotel_email,
    hotel_phone,
    hotel_website,
    contact_first_name,
    contact_last_name,
    contact_email,
    contact_phone,
    password,
  } = req.body;
  const refinedHotelEmail = hotel_email.toLowerCase();
  const refinedContactEmail = contact_email.toLowerCase();
  let existingHotelEmail;
  let existingContactEmail;

  try {
    existingHotelEmail = await Host.findOne({ hotel_email: refinedHotelEmail });
  } catch (err) {
    console.log(err);
  }
  if (existingHotelEmail) {
    return sendError(
      res,
      `Email already associated with another hotel - ${existingHotelEmail.hotel_name}. Please login instead.`
    );
  }
  try {
    existingContactEmail = await Host.findOne({ contact_email: refinedContactEmail });
  } catch (err) {
    console.log(err);
  }
  if (existingContactEmail) {
    return sendError(
      res,
      `Email already associated with another hotel contact - ${existingContactEmail.hotel_name}. Please login instead.`
    );
  }
  req.body = {
    hotel_name,
    country,
    state,
    city,
    lga,
    postal_code,
    hotel_address,
    hotel_email: refinedHotelEmail,
    hotel_phone,
    hotel_website,
    contact_first_name,
    contact_last_name,
    contact_email: refinedContactEmail,
    contact_phone,
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
