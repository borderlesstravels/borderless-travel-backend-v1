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
