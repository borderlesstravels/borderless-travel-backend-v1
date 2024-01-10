const { isValidObjectId } = require('mongoose');
const Admin = require('../models/admin/Admin');
const ResetPasswordToken = require('../models/user/ResetPasswordToken');
const { sendError } = require('../utils/helpers');
const { log } = require('console');

const validateNewAdmin = async (req, res, next) => {
  const { first_name, last_name, email, phone, role, username, password } = req.body;

  const refinedUsername = username.toLowerCase();
  const refinedEmail = email.toLowerCase();
  log('email', email);
  log('refinedEmail', refinedEmail);

  let existingAdmin;
  let existingUsername;
  let existingPhone;

  try {
    existingAdmin = await Admin.findOne({ email: refinedEmail });
  } catch (err) {
    console.log(err);
  }
  if (existingAdmin) {
    return sendError(
      res,
      `Email already used fpor another admin with name - ${existingAdmin.first_name} ${existingAdmin.last_name}`
    );
  }

  try {
    existingUsername = await Admin.findOne({ username: refinedUsername });
  } catch (err) {
    console.log(err);
  }
  if (existingUsername) {
    return sendError(res, 'Username already taken');
  }

  try {
    existingPhone = await Admin.findOne({ phone });
  } catch (err) {
    console.log(err);
  }
  if (existingPhone) {
    return sendError(res, 'This phone number has already been registered');
  }

  req.body = {
    first_name,
    last_name,
    email: refinedEmail,
    phone,
    role,
    username: refinedUsername,
    password,
  };

  next();
};

const isAdminPasswordResetTokenValid = async (req, res, next) => {
  const { token, id } = req.query;

  if (!token || !id) return sendError(res, 'Invalid request');

  if (!isValidObjectId(id)) return sendError(res, 'Invalid user');

  const admin = await Admin.findById(id);

  if (!admin) return sendError(res, 'Admin not found');

  const resToken = await ResetPasswordToken.findOne({ owner: admin._id });
  if (!resToken) return sendError(res, 'Reset token not found');

  const resetToken = resToken.token;

  if (token !== resetToken) {
    return sendError(res, 'Reset token is invalid');
  }

  req.body.admin = admin;
  next();
};

const validateAdminLoginType = async (req, res, next) => {
  const { idString, password } = req.body;

  let existingAdmin;
  let adminIdentity;

  if (idString.includes('@')) {
    adminIdentity = idString.toLowerCase();
    try {
      existingAdmin = await Admin.findOne({ email: adminIdentity });
    } catch (err) {
      return sendError(res, err.message, 500);
    }
    if (!existingAdmin) {
      return sendError(res, 'Email not registered. Access denied.');
    }
  } else if (idString.charAt(0) === '+' || idString.charAt(0) === 0) {
    try {
      existingAdmin = await Admin.findOne({ phone: idString });
    } catch (err) {
      return sendError(res, err.message, 500);
    }
    if (!existingAdmin) {
      return sendError(res, 'Phone number not registered. Access denied.');
    }
  } else {
    adminIdentity = idString.toLowerCase();
    try {
      existingAdmin = await Admin.findOne({ username: adminIdentity });
    } catch (err) {
      return sendError(res, err.message, 500);
    }
    if (!existingAdmin) {
      return sendError(res, 'Username not registered. Access denied.');
    }
  }

  req.body = {
    existingAdmin,
    password,
  };

  next();
};

module.exports = {
  validateNewAdmin,
  isAdminPasswordResetTokenValid,
  validateAdminLoginType,
};
