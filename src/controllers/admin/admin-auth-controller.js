const VerificationToken = require('../../models/user/VerificationToken');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendError, createRandomBytes, generateOTP } = require('../../utils/helpers');
const { isValidObjectId } = require('mongoose');
const ResetPasswordToken = require('../../models/user/ResetPasswordToken');
const Admin = require('../../models/admin/Admin');
const AdminLoginToken = require('../../models/admin/AdminLoginToken');
const { log } = require('console');

const verifyEmail = async (req, res, next) => {
  const { userId, otp } = req.body;

  if (!userId || !otp.trim()) return sendError(res, 'Invalid request. Missing parameters');
  if (!isValidObjectId(userId)) return sendError(res, 'Invalid user id');

  const admin = await Admin.findById(userId, '-password');
  console.log(admin);
  if (!admin) return sendError(res, 'Sorry, user not found');

  if (admin.email_verified) return sendError(res, "Account's email is already verified");

  const vToken = await VerificationToken.findOne({ owner: admin._id });
  if (!vToken) return sendError(res, 'Sorry, verification token not found on our database');
  const token = vToken.token;

  const isTokenMatched = bcrypt.compareSync(otp, token);
  if (!isTokenMatched) {
    return sendError(res, 'Please provide a valid token');
  }

  admin.email_verified = true;

  await VerificationToken.findByIdAndDelete(vToken._id);
  await admin.save();
  console.log('User verified');
  req.body = {
    user: admin,
  };
  next();
};

// FORGOT PASSWORD
const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  if (!email) return sendError(res, 'Please provide account email');

  const admin = await Admin.findOne({ email });
  if (!admin) return sendError(res, 'Sorry, user not found. Invalid request');

  if (!admin.email_verified) {
    return res.status(401).json({
      success: true,
      message: 'Unverified email',
      userId: admin._id,
    });
  }

  const checkToken = await ResetPasswordToken.findOne({ owner: admin._id });
  if (checkToken) return sendError(res, 'You can only request a new token after an hour');

  // Generate token
  const token = await createRandomBytes();

  const resetToken = new ResetPasswordToken({ owner: admin._id, token });
  await resetToken.save();
  req.body = {
    user: admin,
    token,
  };
  next();
};

const resetPassword = async (req, res, next) => {
  const { admin, password } = req.body;
  const isPasswordSame = bcrypt.compareSync(password, admin.password);
  if (isPasswordSame) return sendError(res, 'New password must be different from the old password');
  if (password.trim().length < 8 || password.trim().length > 20)
    return sendError(res, 'Password must be between 8 and 20 charcaters long');

  const hashedPassword = bcrypt.hashSync(password);

  admin.password = hashedPassword;
  await admin.save();
  await ResetPasswordToken.findOneAndDelete({ owner: admin._id });

  req.body = {
    user: admin,
  };
  next();
};

// LOGIN
const loginAdminAttempt = async (req, res, next) => {
  const { existingAdmin, password } = req.body;

  const isPasswordCorrect = bcrypt.compareSync(password, existingAdmin.password);
  if (!isPasswordCorrect) {
    return sendError(res, 'Invalid email or password');
  }
  if (!existingAdmin.email_verified) {
    return res.status(206).json({
      success: true,
      message: 'Unverified email',
      userId: existingAdmin._id,
    });
  }
  console.log('Login phase 1 checked');
  req.body = {
    userId: existingAdmin._id,
  };
  next();
};

const generateAdminLoginToken = async (req, res, next) => {
  const { userId } = req.body;
  if (!userId) return sendError(res, 'Invalid request. Missing parameters');
  let existingLoginToken;
  const admin = await Admin.findById(userId, '-password');
  if (!admin) {
    return sendError(res, 'Admin account not found', 404);
  }
  try {
    existingLoginToken = await AdminLoginToken.findOne({ owner: userId });
  } catch (err) {
    console.log(err);
  }
  if (existingLoginToken) {
    await AdminLoginToken.findByIdAndDelete(existingLoginToken._id);
  }
  const otp = generateOTP();
  const hashedOtp = bcrypt.hashSync(otp);
  const adminLoginToken = new AdminLoginToken({
    owner: userId,
    token: hashedOtp,
  });
  try {
    await adminLoginToken.save();
    console.log('OTP sent');
    req.body = {
      user: admin,
      otp,
    };
    next();
  } catch (err) {
    console.log(err);
    return sendError(res, 'Unable to send OTP');
  }
};

const verifyLoginAttempt = async (req, res, next) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) return sendError(res, 'Invalid request. Missing parameters');
  if (!isValidObjectId(userId)) return sendError(res, 'Invalid admin id');

  const admin = await Admin.findById(userId, '-password');
  if (!admin) return sendError(res, 'Sorry, admin not found');

  const vToken = await AdminLoginToken.findOne({ owner: admin._id });
  if (!vToken) return sendError(res, 'Sorry, verification token not found');
  const token = vToken.token;

  const isTokenMatched = bcrypt.compareSync(otp, token);
  if (!isTokenMatched) {
    return sendError(res, 'Please provide a valid token');
  }

  await AdminLoginToken.findByIdAndDelete(vToken._id);
  console.log('admin login verified');
  req.body = { admin };
  next();
};

const logAdminIn = async (req, res, next) => {
  const { admin } = req.body;
  const token = jwt.sign({ id: admin._id }, process.env.JWT_ADMIN_SECRET_KEY, {
    expiresIn: '5d',
  });
  res.cookie(String(admin._id), token, {
    path: '/',
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
    httpOnly: true,
    sameSite: 'lax',
  });

  req.body = { user: admin, token };
  next();
};

const isAdminLogin = async (req, res) => {
  const cookies = req.headers.cookie;
  if (cookies) {
    return res.status(200).json({ success: true, message: 'You are logged in' });
  } else if (!cookies) {
    return sendError(res, 'No session found. You are not logged in', 401);
  }
};

const verifyAdminLoginToken = (req, res, next) => {
  const cookies = req.headers.cookie;
  if (!cookies) {
    return sendError(res, 'You are not authenticated or authorised to perform this operation');
  }
  const token = cookies.split('=')[1];
  if (!token) {
    return sendError(res, 'You are not authenticated or authorised to perform this operation');
  }
  jwt.verify(String(token), process.env.JWT_ADMIN_SECRET_KEY, (err, admin) => {
    if (err) {
      return sendError(res, 'Invalid authorisation token', 404);
    }
    req.id = admin.id;
  });
  next();
};

const logoutAdmin = (req, res, next) => {
  console.log('Logout api called');
  const cookies = req.headers.cookie;
  if (!cookies) {
    return sendError(res, 'No cookie found', 205);
  }
  const token = cookies.split('=')[1];
  if (!token) {
    return sendError(res, 'No token found', 205);
  }
  jwt.verify(String(token), process.env.JWT_ADMIN_SECRET_KEY, (err, admin) => {
    if (err) {
      return sendError(res, 'Invalid Token', 400);
      // return res.status(400).json({ message: "Invalid Token" })
    }
    res.clearCookie(`${admin.id}`);
    req.cookies[`${admin.id}`] = '';
    return res.status(200).json({ success: true, message: 'Successfully logged out' });
  });
};

module.exports = {
  verifyEmail,
  forgotPassword,
  resetPassword,

  loginAdminAttempt,
  generateAdminLoginToken,

  verifyLoginAttempt,
  logAdminIn,

  isAdminLogin,
  verifyAdminLoginToken,
  logoutAdmin,
};
