const VerificationToken = require('../../models/user/VerificationToken');
const bcrypt = require('bcryptjs');
const { sendError, generateOTP } = require('../../utils/helpers');
const Admin = require('../../models/admin/Admin');
const { log } = require('console');

const addAdmin = async (req, res, next) => {
  const { first_name, last_name, email, phone, role, username, password } = req.body;
  log('password:', password);

  const hashedPassword = bcrypt.hashSync(password);
  const admin = new Admin({
    first_name,
    last_name,
    email,
    phone,
    role,
    username,
    password: hashedPassword,
  });

  try {
    await admin.save();
    console.log('Admin successfully added');
    req.body = {
      userId: admin._id,
    };
    next();
  } catch (err) {
    console.log(err);
    return sendError(res, 'Unable to sign up');
  }
};

const generateAdminEmailVerificationToken = async (req, res, next) => {
  const { userId } = req.body;
  if (!userId) {
    return sendError(res, 'Invalid request. Missing parameters');
  }
  let existingVerificationToken;
  const admin = await Admin.findById(userId, '-password');

  if (admin.email_verified) return sendError(res, "Account's email is already verified");

  try {
    existingVerificationToken = await VerificationToken.findOne({ userId });
  } catch (err) {
    console.log(err);
  }
  if (existingVerificationToken) {
    await VerificationToken.findByIdAndDelete(existingVerificationToken._id);
  }

  const otp = generateOTP();
  const hashedOtp = bcrypt.hashSync(otp);

  const verificationToken = new VerificationToken({
    owner: userId,
    token: hashedOtp,
  });

  try {
    await verificationToken.save();
    console.log('Email verification OTP generated');
    req.body = {
      user: admin,
      otp,
    };
    next();
  } catch (err) {
    console.log(err);
    return sendError(res, 'Unable to generate email verification OTP');
  }
};

const updateAdminProfile = async (req, res) => {
  if (req.body.password) {
    req.body.password = bcrypt.hashSync(req.body.password);
  }
  try {
    const savedAdminProfile = await Admin.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      message: 'Successfully updated the admin profile',
      data: savedAdminProfile,
    });
  } catch (err) {
    console.log(err);
    return sendError(res, 'Unable to update the admin profile');
  }
};

const deleteAdmin = async (req, res) => {
  try {
    await Admin.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Successfully deleted the admin profile',
    });
  } catch (err) {
    console.log(err);
    return sendError(res, 'Unable to delete the admin profile');
  }
};

const fetchAllAdmins = async (req, res, next) => {
  try {
    const admins = await Admin.find().limit(req.query.limit);
    return res.status(200).json({ success: true, data: admins });
  } catch (error) {
    return sendError(res, 'Unable to fetch the admins data');
  }
};

const fetchSingleAdmin = async (req, res, next) => {
  const { id } = req.params;
  try {
    const admin = await Admin.findById(id);
    if (!admin) {
      return sendError(res, 'Admin data does not exist');
    }
    return res.status(200).json({ success: true, data: admin });
  } catch (error) {
    return sendError(res, 'Unable to fetch the admin profile data');
  }
};

module.exports = {
  addAdmin,
  generateAdminEmailVerificationToken,
  updateAdminProfile,
  deleteAdmin,
  fetchAllAdmins,
  fetchSingleAdmin,
};
