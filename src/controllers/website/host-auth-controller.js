const VerificationToken = require('../../models/user/VerificationToken');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendError, createRandomBytes, generateOTP } = require('../../utils/helpers');
const { isValidObjectId } = require('mongoose');
const Host = require('../../models/host/Host');
const ResetHostPasswordToken = require('../../models/host/ResetHostPasswordToken');

const signupHost = async (req, res, next) => {
  const salt = bcrypt.genSaltSync(10)
  req.body.password = bcrypt.hashSync(req.body.password, salt);
  const host = new Host(req.body);
  try {
    await host.save();
    console.log('Host successfully signed up');
    req.body = {
      userId: host._id,
    };
    next();
  } catch (err) {
    console.log(err);
    return sendError(res, `Unable to sign up. Error - ${err}`);
  }
};

const generateHostEmailVerificationToken = async (req, res, next) => {
  const { userId } = req.body;
  if (!userId) {
    return sendError(res, 'Invalid request. Missing parameters');
  }
  let existingVerificationToken;
  const host = await Host.findById(userId, '-password');

  if (host.email_verified) return sendError(res, "Account's email is already verified");

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
      user: {
        _id: host._id,
        email: host.email,
        first_name: host.first_name,
      },
      otp,
    };
    next();
  } catch (err) {
    console.log(err);
    return sendError(res, 'Unable to generate email verification OTP');
  }
};

const verifyHostEmail = async (req, res, next) => {
  const { userId, otp } = req.body;

  if (!userId || !otp.trim()) return sendError(res, 'Invalid request. Missing parameters');
  if (!isValidObjectId(userId)) return sendError(res, 'Invalid Host id');

  const host = await Host.findById(userId, '-password');
  console.log(host);
  if (!host) return sendError(res, 'Sorry, Host account not found');

  if (host.email_verified) return sendError(res, "Account's email is already verified");

  const vToken = await VerificationToken.findOne({ owner: host._id });
  if (!vToken) return sendError(res, 'Sorry, verification token not found on our database');
  const token = vToken.token;

  const isTokenMatched = bcrypt.compareSync(otp, token);
  if (!isTokenMatched) {
    return sendError(res, 'Please provide a valid token');
  }

  host.email_verified = true;

  await VerificationToken.findByIdAndDelete(vToken._id);
  await host.save();
  console.log('Host verified');
  req.body = {
    user: {
      _id: host._id,
      email: host.email,
      first_name: host.first_name,
      last_name: host.last_name,
      email_verified: host.email_verified,
    },
  };
  next();
};

// FORGOT PASSWORD
const forgotPasswordHost = async (req, res, next) => {
  const { email } = req.body;
  if (!email) return sendError(res, 'Please provide your Host account contact email');

  const host = await Host.findOne({ email });
  if (!host)
    return sendError(
      res,
      'Sorry, Host account not found. Be sure to provide a correct Host account contact email'
    );

  if (!host.email_verified) {
    return res.status(401).json({
      success: true,
      message: 'Unverified email',
      userId: host._id,
    });
  }

  const checkToken = await ResetHostPasswordToken.findOne({ owner: host._id });
  if (checkToken) return sendError(res, 'You can only request a new token after 10 minutes');

  // Generate token
  const token = await createRandomBytes();
  const resetToken = new ResetHostPasswordToken({ owner: host._id, token });
  await resetToken.save();
  req.body = {
    user: {
      _id: host._id,
      email: host.email,
      first_name: host.first_name,
      last_name: host.last_name,
      email_verified: host.email_verified,
    },
    type: 'host',
    token,
  };
  next();
};

const resetPasswordHost = async (req, res, next) => {
  const { host, password } = req.body;
  const isPasswordSame = bcrypt.compareSync(password, host.password);
  if (isPasswordSame) return sendError(res, 'New password must be different from the old password');
  if (password.trim().length < 8 || password.trim().length > 20)
    return sendError(res, 'Password must be between 8 and 20 charcaters long');

  const salt = bcrypt.genSaltSync(10)
  const hashedPassword = bcrypt.hashSync(password, salt);

  host.password = hashedPassword;
  await host.save();
  await ResetHostPasswordToken.findOneAndDelete({ owner: host._id });

  req.body = {
    user: {
      _id: host._id,
      email: host.email,
      first_name: host.first_name,
      last_name: host.last_name,
      email_verified: host.email_verified,
    },
  };
  next();
};

// LOGIN
const loginHost = async (req, res, next) => {
  const { host, password } = req.body;

  console.log('password', password)
  console.log('host.password', host.password)
  
  const isPasswordCorrect = bcrypt.compareSync(password, host.password);
  console.log('isPasswordCorrect', isPasswordCorrect)
  if (!isPasswordCorrect) {
    return sendError(res, 'Invalid login ID or password');
  }
  if (!host.email_verified) {
    return res.status(401).json({
      success: true,
      message: 'Unverified email',
      userId: host._id,
    });
  }
  console.log('Login phase 1 checked');

  const token = jwt.sign({ id: host._id }, process.env.JWT_HOST_SECRET_KEY, {
    expiresIn: '5d',
  });
  res.cookie(String(host._id), token, {
    path: '/',
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
    httpOnly: true,
    sameSite: process.env.MODE === 'development' ? 'lax' : 'none',
    secure: process.env.MODE === 'development' ? false : true,
    // sameSite: 'lax',
  });
  req.body = {
    user: {
      _id: host._id,
      email: host.email,
      first_name: host.first_name,
      last_name: host.last_name,
      email_verified: host.email_verified,
    },
    token,
  };
  next();
};

const verifyHostLoginToken = (req, res, next) => {
  const cookies = req.headers.cookie;
  if (!cookies) {
    return sendError(res, 'You are not authenticated to perform this operation', 401);
  }
  const token = cookies.split('=')[1];
  if (!token) {
    return sendError(res, 'You are not authenticated to perform this operation', 401);
  }
  jwt.verify(String(token), process.env.JWT_HOST_SECRET_KEY, (err, host) => {
    if (err) {
      return sendError(res, 'Invalid authorisation token', 401);
    }
    req.id = host.id;
  });
  next();
};

module.exports = {
  signupHost,
  generateHostEmailVerificationToken,
  verifyHostEmail,
  forgotPasswordHost,
  resetPasswordHost,
  loginHost,
  verifyHostLoginToken,
};
