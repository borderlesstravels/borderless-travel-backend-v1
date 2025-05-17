const User = require("../../models/user/User");
const VerificationToken = require("../../models/user/VerificationToken");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  sendError,
  createRandomBytes,
  generateOTP,
  sendLoginError,
  checkUserEmailReg,
  sendSuccess,
  localSession,
  liveSession,
  localSessionLogout,
  liveSessionLogout,
} = require("../../utils/helpers");
const { isValidObjectId } = require("mongoose");
const ResetPasswordToken = require("../../models/user/ResetPasswordToken");
const UserReferral = require("../../models/user/UserReferral");

const signup = async (req, res, next) => {
  const { first_name, last_name, email, password, referred_by } = req.body;
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);
  const user = new User({
    first_name,
    last_name,
    email,
    password: hashedPassword,
    referred_by,
  });

  try {
    await user.save();
    console.log("User successfully signed up");
    if (referred_by !== "") {
      const referrer = await User.findOne({ referral_code: referred_by });
      if (referrer) {
        const referrerData = await UserReferral.findOne({
          owner: referrer._id,
        });
        const referrals = referrerData.referrals;
        referrerData.referrals = referrals + 1;
        try {
          await referrerData.save();
        } catch (error) {
          console.log(error);
          return sendError(res, "Unable to setup referral profile");
        }
      }
    }
    req.body = {
      userId: user._id,
    };
    next();
  } catch (err) {
    console.log(err);
    return sendError(res, `Unable to sign up. Error - ${err}`);
  }
};

const generateEmailVerificationToken = async (req, res, next) => {
  const { userId } = req.body;
  console.log("userId: ", userId);
  if (!userId) {
    return sendError(res, "Invalid request. Missing parameters");
  }
  let existingVerificationToken;
  const user = await User.findById(userId, "-password");

  if (user.email_verified)
    return sendError(res, "Account's email is already verified");

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
    console.log("Email verification OTP generated");
    req.body = {
      user,
      otp,
    };
    next();
  } catch (err) {
    console.log(err);
    return sendError(res, "Unable to generate email verification OTP");
  }
};

const verifyEmail = async (req, res, next) => {
  const { userId, otp } = req.body;

  if (!userId || !otp.trim())
    return sendError(res, "Invalid request. Missing parameters");
  if (!isValidObjectId(userId)) return sendError(res, "Invalid user id");

  const user = await User.findById(userId, "-password");
  console.log(user);
  if (!user) return sendError(res, "Sorry, user not found");

  if (user.email_verified)
    return sendError(res, "Account's email is already verified");

  const vToken = await VerificationToken.findOne({ owner: user._id });
  if (!vToken) return sendError(res, "Sorry, user not found");
  const token = vToken.token;

  const isTokenMatched = bcrypt.compareSync(otp, token);
  if (!isTokenMatched) {
    return sendError(res, "Please provide a valid token");
  }

  user.email_verified = true;
  user.status = "Active";

  await VerificationToken.findByIdAndDelete(vToken._id);
  await user.save();
  console.log("User verified");

  const loginTtoken = jwt.sign(
    { id: user._id },
    process.env.JWT_USER_SECRET_KEY,
    {
      expiresIn: "10d",
    }
  );
  res.cookie(String(user._id), loginTtoken, {
    path: "/",
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
    httpOnly: true,
    // sameSite: "lax",
    sameSite: "none",
    secure: true,
  });
  req.body = { user };
  next();
};

// FORGOT PASSWORD
const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  if (!email) return sendError(res, "Please provide account email");

  const user = await User.findOne({ email });
  if (!user) return sendError(res, "Sorry, user not found. Invalid request");

  if (!user.email_verified) {
    return res.status(401).json({
      success: true,
      message: "Unverified email",
      userId: user._id,
    });
  }

  const checkToken = await ResetPasswordToken.findOne({ owner: user._id });
  if (checkToken)
    return sendError(res, "You can only request a new token after 10 minutes");

  // Generate token
  const token = await createRandomBytes(30);

  const resetToken = new ResetPasswordToken({ owner: user._id, token });
  await resetToken.save();
  req.body = {
    user,
    token,
    type: "user",
  };
  next();
};

const resetPassword = async (req, res, next) => {
  const { user, password } = req.body;
  const isPasswordSame = bcrypt.compareSync(password, user.password);
  if (isPasswordSame)
    return sendError(
      res,
      "New password must be different from the old password"
    );
  if (password.trim().length < 8 || password.trim().length > 20)
    return sendError(res, "Password must be between 8 and 20 charcaters long");

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  user.password = hashedPassword;
  await user.save();
  await ResetPasswordToken.findOneAndDelete({ owner: user._id });

  req.body = {
    user,
  };
  next();
};

// LOGIN
const login = async (req, res, next) => {
  const { user, password } = req.body;

  const origin = req.get("host");
  console.log("origin", origin);

  const isPasswordCorrect = bcrypt.compareSync(password, user.password);
  if (!isPasswordCorrect) {
    return sendLoginError(res, "Invalid login ID or password", 0);
  }
  if (!user.email_verified) {
    return res.status(401).json({
      success: true,
      loginStatus: 1,
      message: "Unverified email",
      userId: user._id,
    });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_USER_SECRET_KEY, {
    expiresIn: "1d",
  });
  res.cookie(
    String(user._id),
    token,
    origin.includes("localhost") ? localSession : liveSession
  );
  req.body = { user, token };
  next();
};

const isUserLogin = async (req, res) => {
  const cookies = req.headers.cookie;
  console.log("Session check cookie: ", cookies);
  if (cookies) {
    return res
      .status(200)
      .json({ success: true, message: "You are a logged in user" });
  } else if (!cookies) {
    return sendError(res, "No session found. You are not logged in");
  }
};

const verifyUserLoginToken = (req, res, next) => {
  const cookies = req.headers.cookie;
  if (!cookies) {
    return sendError(res, "No cookie found", 404);
  }
  const token = cookies.split("=")[1];
  if (!token) {
    return sendError(res, "No token found", 404);
  }
  jwt.verify(String(token), process.env.JWT_USER_SECRET_KEY, (err, user) => {
    if (err) {
      return sendError(res, "Invalid Token", 404);
    } else {
      req.id = user.id;
      next();
    }
  });
};

const logout = (req, res, next) => {
  const origin = req.get("host");
  console.log("origin", origin);
  const cookies = req.headers.cookie;
  console.log("cookies: ", cookies);
  if (!cookies) {
    return sendError(
      res,
      "No cookie found.  You are never logged in to begin with",
      401
    );
  }
  const token = cookies.split("=")[1];
  console.info("token:", token);
  // const token2 = cookies.split(";")[0];
  // console.info("token2:", token2);

  let session;

  if (origin.includes("localhost")) {
    session = { ...localSessionLogout, domain: origin };
  } else {
    session = { ...liveSessionLogout, domain: origin };
  }

  console.log("session", session);

  if (!token) {
    return sendError(
      res,
      "No token found.  You are never logged in to begin with",
      401
    );
  }
  jwt.verify(String(token), process.env.JWT_USER_SECRET_KEY, (err, user) => {
    if (err) {
      console.log("err", err);
      return sendError(res, `Invalid Token - ${err}`, 400);
    }
    if (user) {
      // console.log("user", user);
      // console.log("req.cookies", req.cookies);
      // console.log("req.cookies[`${user.id}`]", req.cookies[`${user.id}`]);

      // res.cookie(
      //   String(user.id),
      //   token,
      //   origin.includes("localhost") ? localSessionLogout : liveSessionLogout
      // );

      res.clearCookie(`${user.id}`);
      req.cookies[`${user.id}`] = "";
      setTimeout(() => {
        return sendSuccess(res, "Successfully logged out");
      }, 200);

      // console.log("req.cookies 2", req.cookies);
      // console.log("req.cookies[`${user.id}`] 2", req.cookies[`${user.id}`]);
    }
  });
};

const isEmailRegistered = async (req, res) => {
  const { email } = req.body;
  const user = await checkUserEmailReg(email);
  console.log(user);
  if (user) {
    return sendSuccess(res, "Email is registered", user);
  } else {
    return sendError(res, "Email not registered");
  }
};

module.exports = {
  signup,
  generateEmailVerificationToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
  login,
  isUserLogin,
  verifyUserLoginToken,
  logout,
  isEmailRegistered,
};
