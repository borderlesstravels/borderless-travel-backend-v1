const { nanoid } = require("nanoid");
const jwt = require("jsonwebtoken");
const SessionStore = require("../models/general/SessionStore");
const { sendError } = require("../utils/helpers");

const addSessionToken = async (key, value) => {
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
    return false;
  }
};

const getSessionToken = async (key) => {
  try {
    const session = await SessionStore.findOne({ key });
    if (session) {
      return session;
    }
  } catch (error) {
    console.log("session store error:", error);
    return false;
  }
};

const deleteSessionToken = async (id) => {
  try {
    const deleteSession = await SessionStore.findByIdAndDelete(id);
    if (deleteSession) {
      return true;
    }
  } catch (error) {
    console.log("session store deletion error:", error);
    return false;
  }
};

const createLoginSession = async (id, secrete) => {
  const sessionId = nanoid();
  console.log("sessionId", sessionId);
  const token = jwt.sign(id, secrete, {
    expiresIn: "1d",
  });
  await addSessionToken(sessionId, token);
  return { sessionId, token };
};

const verifyLoginSession = async (token, secrete, req) => {
  console.log("token", token);
  let result;
  jwt.verify(String(token), secrete, (err, user) => {
    if (err) {
      result = false;
    }
    if (user) {
      req.id = user.id;
      result = true;
    }
  });
  return result;
};

const logoutSession = async (token, secrete) => {
  let result;
  jwt.verify(String(token), secrete, (err, user) => {
    if (err) {
      console.log("logout error:", err);
      result = false;
    }
    if (user) {
      result = true;
    }
  });
  console.log("result", result);
  return result;
};

module.exports = {
  addSessionToken,
  getSessionToken,
  deleteSessionToken,

  createLoginSession,
  verifyLoginSession,
  logoutSession,
};
