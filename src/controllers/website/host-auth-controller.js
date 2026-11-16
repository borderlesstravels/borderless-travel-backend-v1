const VerificationToken = require("../../models/user/VerificationToken");
const bcrypt = require("bcryptjs");
const {
  sendError,
  createRandomBytes,
  generateOTP,
} = require("../../utils/helpers");
const { isValidObjectId } = require("mongoose");
const Host = require("../../models/host/Host");
const ResetHostPasswordToken = require("../../models/host/ResetHostPasswordToken");
const { nanoid } = require("nanoid");
const {
  getSessionToken,
  createLoginSession,
  verifyLoginSession,
} = require("../../middlewares/general");
const HostBalance = require("../../models/host/HostBalance");

const signupHost = async (req, res, next) => {
  const salt = bcrypt.genSaltSync(10);
  req.body.password = bcrypt.hashSync(req.body.password, salt);
  const host = new Host(req.body);
  try {
    const hostBal = new HostBalance({
      owner: host._id,
    });
    await hostBal.save();
    await host.save();
    console.log("Host successfully signed up");
    req.body = {
      userId: host._id,
    };
    next();
  } catch (error) {
    console.log(error);
    return sendError(res, `Unable to sign up. Error - ${error}`);
  }
};

const generateHostEmailVerificationToken = async (req, res, next) => {
  const { userId } = req.body;
  if (!userId) {
    return sendError(res, "Invalid request. Missing parameters");
  }
  let existingVerificationToken;
  const host = await Host.findById(userId, "-password");

  if (host.email_verified)
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
      user: {
        _id: host._id,
        email: host.email,
        first_name: host.first_name,
      },
      otp,
    };
    next();
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to generate email verification OTP");
  }
};

const verifyHostEmail = async (req, res, next) => {
  const { userId, otp } = req.body;

  if (!userId || !otp.trim())
    return sendError(res, "Invalid request. Missing parameters");
  if (!isValidObjectId(userId)) return sendError(res, "Invalid Host id");

  const host = await Host.findById(userId, "-password");
  console.log(host);
  if (!host) return sendError(res, "Sorry, Host account not found");

  if (host.email_verified)
    return sendError(res, "Account's email is already verified");

  const vToken = await VerificationToken.findOne({ owner: host._id });
  if (!vToken)
    return sendError(
      res,
      "Sorry, verification token not found on our database"
    );
  const token = vToken.token;

  const isTokenMatched = bcrypt.compareSync(otp, token);
  if (!isTokenMatched) {
    return sendError(res, "Please provide a valid token");
  }

  host.email_verified = true;
  host.status = "Active";

  await VerificationToken.findByIdAndDelete(vToken._id);
  await host.save();
  console.log("Host verified");

  const { sessionId } = await createLoginSession(
    { id: host._id },
    process.env.JWT_HOST_SECRET_KEY
  );
  res.set("u-x-key", sessionId);
  res.header("Access-Control-Expose-Headers", "u-x-key");

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
  if (!email)
    return sendError(res, "Please provide your Host account contact email");

  const host = await Host.findOne({ email: email.toLowerCase() });
  if (!host)
    return sendError(
      res,
      "Sorry, Host account not found. Be sure to provide a correct Host account contact email"
    );

  if (!host.email_verified) {
    return res.status(401).json({
      success: true,
      message: "Unverified email",
      userId: host._id,
    });
  }

  const checkToken = await ResetHostPasswordToken.findOne({ owner: host._id });
  if (checkToken)
    return sendError(res, "You can only request a new token after 10 minutes");

  // Generate token
  const token = await createRandomBytes(30);
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
    type: "host",
    token,
  };
  next();
};

const resetPasswordHost = async (req, res, next) => {
  const { host, password } = req.body;
  const isPasswordSame = bcrypt.compareSync(password, host.password);
  if (isPasswordSame)
    return sendError(
      res,
      "New password must be different from the old password"
    );
  if (password.trim().length < 8 || password.trim().length > 20)
    return sendError(res, "Password must be between 8 and 20 charcaters long");

  const salt = bcrypt.genSaltSync(10);
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

  const isPasswordCorrect = bcrypt.compareSync(password, host.password);
  if (!isPasswordCorrect) {
    return sendError(res, "Invalid login ID or password");
  }
  if (!host.email_verified) {
    return res.status(401).json({
      success: true,
      loginStatus: 1,
      message: "Unverified email",
      userId: host._id,
    });
  }

  const { sessionId, token } = await createLoginSession(
    { id: host._id },
    process.env.JWT_HOST_SECRET_KEY
  );
  res.set("u-x-key", sessionId);
  res.header("Access-Control-Expose-Headers", "u-x-key");

  return res.status(200).json({
    success: true,
    loginStatus: 2,
    message: "Successfully logged in",
    user: {
      first_name: host.first_name,
      last_name: host.last_name,
      email: host.email,
      id: host._id,
      email_verified: host.email_verified,
    },
    token,
  });
};

const verifyHostLoginToken = async (req, res, next) => {
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
        const token = sessionToken.value;
        const checkSession = await verifyLoginSession(
          token,
          process.env.JWT_HOST_SECRET_KEY,
          req
        );
        if (!checkSession) {
          return sendError(res, "Invalid Token");
        } else {
          req.id = sessionToken.owner;
          next();
        }
      }
    }
  } catch (error) {
    console.log(error);
    return sendError(res, "Unauthorised");
  }
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
