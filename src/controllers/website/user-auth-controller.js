const User = require("../../models/user/User");
const VerificationToken = require("../../models/user/VerificationToken");
const bcrypt = require("bcryptjs");
const {
  sendError,
  createRandomBytes,
  generateOTP,
  sendLoginError,
  checkUserEmailReg,
  sendSuccess,
} = require("../../utils/helpers");
const { isValidObjectId } = require("mongoose");
const ResetPasswordToken = require("../../models/user/ResetPasswordToken");
const UserReferral = require("../../models/user/UserReferral");
const { nanoid } = require("nanoid");
const {
  addSessionToken,
  getSessionToken,
  deleteSessionToken,
  createLoginSession,
  verifyLoginSession,
  logoutSession,
} = require("../../middlewares/general");
const SessionStore = require("../../models/general/SessionStore");

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

  const { sessionId } = await createLoginSession(
    { id: user._id },
    process.env.JWT_USER_SECRET_KEY
  );
  res.set("u-x-key", sessionId);
  res.header("Access-Control-Expose-Headers", "u-x-key");

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

  const { sessionId, token } = await createLoginSession(
    { id: user._id },
    process.env.JWT_USER_SECRET_KEY
  );
  res.set("u-x-key", sessionId);
  res.header("Access-Control-Expose-Headers", "u-x-key");
  req.body = { user, token };
  next();
};

const isUserLogin = async (req, res) => {
  const tokenKey = req.headers["u-x-key"];
  console.log(tokenKey);
  try {
    if (!tokenKey) {
      return sendError(res, "Unauthorised. No headers key");
    }
    if (tokenKey) {
      const sessionToken = await getSessionToken(String(tokenKey));
      if (!sessionToken) {
        return sendError(res, "Session token expired");
      }
      if (sessionToken) {
        return sendSuccess(res, "You are a logged in user");
      }
    }
  } catch (error) {
    console.log(error);
    return sendError(res, "Unauthorised");
  }
};

const verifyUserLoginToken = async (req, res, next) => {
  const tokenKey = req.headers["u-x-key"];
  console.log(tokenKey);
  try {
    if (!tokenKey) {
      return sendError(res, "Unauthorised. No headers key");
    }
    if (tokenKey) {
      const sessionToken = await getSessionToken(String(tokenKey));
      if (!sessionToken) {
        return sendError(res, "Authorization token expired");
      }
      if (sessionToken) {
        console.log("sessionToken", sessionToken);
        const token = sessionToken.value;
        const checkSession = await verifyLoginSession(
          token,
          process.env.JWT_USER_SECRET_KEY,
          req
        );
        console.log("checkSession", checkSession);
        if (!checkSession) {
          return sendError(res, "Invalid Token");
        } else {
          next();
        }
      }
    }
  } catch (error) {
    console.log(error);
    return sendError(res, "Unauthorised");
  }
};

const logout = async (req, res) => {
  const tokenKey = req.headers["u-x-key"];
  try {
    if (!tokenKey) {
      return sendError(res, "Unauthorised. No headers key");
    }
    const sessionToken = await getSessionToken(String(tokenKey));
    if (!sessionToken) {
      return sendSuccess(res, "Session already expired");
    }
    if (sessionToken) {
      const token = sessionToken.value;
      const checkSession = await verifyLoginSession(
        token,
        process.env.JWT_USER_SECRET_KEY,
        req
      );
      if (checkSession) {
        const deleteData = await SessionStore.findByIdAndDelete(
          sessionToken._id
        );
        console.log("deleteData", deleteData);
        if (deleteData) {
          return sendSuccess(res, "Successfully logged out");
        }
        return sendError(res, `Unable to log you out now`);
      } else {
        return sendError(res, `Unable to log you out`);
      }
    }
  } catch (error) {
    return sendError(res, `Something went wrong - ${error}`);
  }
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
