const VerificationToken = require("../../models/user/VerificationToken");
const bcrypt = require("bcryptjs");
const {
  sendError,
  createRandomBytes,
  generateOTP,
  sendSuccess,
} = require("../../utils/helpers");
const { isValidObjectId } = require("mongoose");
const Admin = require("../../models/admin/Admin");
const AdminLoginToken = require("../../models/admin/AdminLoginToken");
const { log } = require("console");
const ResetAdminPasswordToken = require("../../models/admin/ResetAdminPasswordToken");
const {
  createLoginSession,
  getSessionToken,
  verifyLoginSession,
  logoutSession,
} = require("../../middlewares/general");
const SessionStore = require("../../models/general/SessionStore");

const verifyEmail = async (req, res, next) => {
  const { userId, otp } = req.body;

  if (!userId || !otp.trim())
    return sendError(res, "Invalid request. Missing parameters");
  if (!isValidObjectId(userId)) return sendError(res, "Invalid user id");

  const admin = await Admin.findById(userId, "-password");
  if (!admin) return sendError(res, "Sorry, user not found");

  if (admin.email_verified)
    return sendError(res, "Account's email is already verified");

  const vToken = await VerificationToken.findOne({ owner: admin._id });
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

  admin.email_verified = true;

  await VerificationToken.findByIdAndDelete(vToken._id);
  await admin.save();
  console.log("User verified");
  req.body = {
    user: admin,
  };
  next();
};

// FORGOT PASSWORD
const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  if (!email) return sendError(res, "Please provide account email");

  const admin = await Admin.findOne({ email });
  if (!admin) return sendError(res, "Sorry, user not found. Invalid request");

  if (!admin.email_verified) {
    return res.status(401).json({
      success: true,
      message: "Unverified email",
      userId: admin._id,
    });
  }

  const checkToken = await ResetAdminPasswordToken.findOne({
    owner: admin._id,
  });
  if (checkToken)
    return sendError(res, "You can only request a new token after 10 minutes");

  // Generate token
  const token = await createRandomBytes(30);

  const resetToken = new ResetAdminPasswordToken({ owner: admin._id, token });
  await resetToken.save();
  req.body = {
    user: admin,
    token,
    type: "admin",
  };
  next();
};

const resetPassword = async (req, res, next) => {
  const { admin, password } = req.body;
  if (typeof password !== "string" || password.length < 8 || password.length > 20) {
    return sendError(res, "Password must be between 8 and 20 characters", 400);
  }
  const isPasswordSame = bcrypt.compareSync(password, admin.password);
  if (isPasswordSame)
    return sendError(
      res,
      "New password must be different from the old password"
    );
  if (password.trim().length < 8 || password.trim().length > 20)
    return sendError(res, "Password must be between 8 and 20 charcaters long");

  const hashedPassword = bcrypt.hashSync(password);

  let updated;
  try {
    updated = await require("../../services/admin-credentials").resetAdminCredential(admin._id, req.query.token, hashedPassword);
  } catch (error) {
    return sendError(res, error.status ? error.message : "Unable to reset admin password", error.status || 503);
  }

  req.body = {
    user: updated,
  };
  next();
};

// LOGIN
const loginAdminAttempt = async (req, res, next) => {
  const { existingAdmin, password } = req.body;
  if (typeof password !== "string") return sendError(res, "Invalid email or password", 401);

  const isPasswordCorrect = bcrypt.compareSync(
    password,
    existingAdmin.password
  );

  if (!isPasswordCorrect) {
    return sendError(res, "Invalid email or password");
  }
  if (!existingAdmin.email_verified) {
    return res.status(206).json({
      success: true,
      message: "Unverified email",
      userId: existingAdmin._id,
    });
  }
  req.adminPasswordVerifiedId = String(existingAdmin._id);
  req.body = {
    userId: existingAdmin._id,
  };
  next();
};

const generateAdminLoginToken = async (req, res, next) => {
  try {
    const { userId, login_challenge } = req.body;
    if (typeof userId !== "string" && typeof userId?.toHexString !== "function") return sendError(res, "Invalid admin identity", 400);
    const admin = await Admin.findById(userId);
    if (!admin) return sendError(res, "Invalid login verification", 401);
    const { startAdminChallenge, resendAdminChallenge } = require("../../services/admin-login-challenge");
    const challenge = req.adminPasswordVerifiedId === String(admin._id)
      ? await startAdminChallenge(admin) : await resendAdminChallenge(admin, login_challenge);
    const user = admin.toObject(); delete user.password;
    req.body = { user, ...challenge };
    return next();
  } catch (error) {
    return sendError(res, error.status ? error.message : "Unable to prepare login verification", error.status || 503);
  }
};

const verifyLoginAttempt = async (req, res, next) => {
  try {
    const { userId, login_challenge, otp } = req.body;
    if (typeof userId !== "string" || !isValidObjectId(userId)) return sendError(res, "Invalid login verification", 401);
    const admin = await Admin.findById(userId);
    if (!admin) return sendError(res, "Invalid login verification", 401);
    await require("../../services/admin-login-challenge").consumeAdminChallenge(admin, login_challenge, otp);
    const safeAdmin = admin.toObject(); delete safeAdmin.password;
    req.body = { admin: safeAdmin };
    return next();
  } catch (error) {
    return sendError(res, error.status ? error.message : "Unable to verify admin login", error.status || 503);
  }
};
const logAdminIn = async (req, res, next) => {
  const { admin } = req.body;
  const { sessionId, token } = await createLoginSession(
    { id: admin._id, auth_version: admin.auth_version || 0 },
    process.env.JWT_ADMIN_SECRET_KEY
  );
  res.set("a-x-key", sessionId);
  res.header("Access-Control-Expose-Headers", "a-x-key");
  req.body = { user: admin, token };
  next();
};

const isAdminLogin = async (req, res) => {
  const tokenKey = req.headers["a-x-key"];
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

const verifyAdminLoginToken = async (req, res, next) => {
  const tokenKey = req.headers["a-x-key"];

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
          process.env.JWT_ADMIN_SECRET_KEY,
          req
        );
        if (!checkSession) {
          return sendError(res, "Invalid Token");
        } else {
          const claims = require("jsonwebtoken").verify(token, process.env.JWT_ADMIN_SECRET_KEY, { algorithms: ["HS256"] });
          const admin = await Admin.findById(sessionToken.owner).select("auth_version email_verified");
          if (String(req.id) !== String(sessionToken.owner) || !admin ||
              !admin.email_verified || claims.auth_version !== admin.auth_version) {
            return sendError(res, "Unauthorised", 401);
          }
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

const getAdmin = async (req, res) => {
  const adminId = req.id;
  let admin;
  try {
    admin = await Admin.findById(adminId, "-password");
  } catch (err) {
    return sendError(res, err.message);
  }
  if (!admin) {
    return sendError(res, "Admin data not found");
  }
  return sendSuccess(res, "successfully fetched admin data", admin);
};

const logoutAdmin = async (req, res) => {
  const tokenKey = req.headers["a-x-key"];
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
        process.env.JWT_ADMIN_SECRET_KEY,
        req
      );
      if (checkSession) {
        const deleteData = await SessionStore.findByIdAndDelete(
          sessionToken._id
        );
        if (deleteData) {
          return sendSuccess(res, "Successfully logged out");
        }
        return sendError(res, `Unable to log you out now`);
      }
    }
  } catch (error) {
    return sendError(res, `Something went wrong - ${error}`);
  }
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

  getAdmin,

  logoutAdmin,
};
