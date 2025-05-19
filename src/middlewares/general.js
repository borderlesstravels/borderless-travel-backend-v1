const { nanoid } = require("nanoid");
const jwt = require("jsonwebtoken");
const SessionStore = require("../models/general/SessionStore");
const { sendError } = require("../utils/helpers");

exports.addSessionToken = async (key, value) => {
  try {
    const newSession = new SessionStore({
      key,
      value,
    });
    const saveSession = await newSession.save();
    if (saveSession) {
      return true;
    }
  } catch (error) {
    console.log("session store error:", error);
    return sendError(res, "Unable to save session");
  }
};

exports.getSessionToken = async (key) => {
  try {
    const session = await SessionStore.findOne({ key });
    if (session) {
      return session;
    }
  } catch (error) {
    console.log("session store error:", error);
    return sendError(res, "Unable to save session");
  }
};

exports.deleteSessionToken = async (id) => {
  try {
    const deleteSession = await SessionStore.findByIdAndDelete(id);
    if (deleteSession) {
      return true;
    }
  } catch (error) {
    console.log("session store deletion error:", error);
    return sendError(res, "Unable to clear session");
  }
};

exports.createLoginSession = async (id, secrete) => {
  const sessionId = nanoid();
  console.log("sessionId", sessionId);
  const token = jwt.sign(id, secrete, {
    expiresIn: "1d",
  });
  await addSessionToken(sessionId, token);
  return { sessionId, token };
};

exports.verifyLoginSession = async (token, secrete) => {
  console.log("token", token);
  jwt.verify(String(token), secrete, (err, user) => {
    if (err) {
      return false;
      return sendError(res, "Invalid Token");
    } else {
      req.id = user.id;
      return true;
    }
  });
};

exports.logoutSession = async (token, secrete, sessionTokenId) => {
  jwt.verify(String(token), secrete, async (err, user) => {
    if (err) {
      console.log("logout error:", err);
      return false;
    }
    if (user) {
      const clearSession = await deleteSessionToken(sessionTokenId);
      if (clearSession) {
        return true;
      } else {
        return false;
      }
    }
  });
};
