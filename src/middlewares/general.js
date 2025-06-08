const { nanoid } = require("nanoid");
const jwt = require("jsonwebtoken");
const SessionStore = require("../models/general/SessionStore");
const { sendError } = require("../utils/helpers");
const cloudinary = require("../../cloudinary");
const fs = require("fs");

const addSessionToken = async (key, value, id) => {
  try {
    const newSession = new SessionStore({
      owner: id,
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
  const sid = id.id;
  await addSessionToken(sessionId, token, sid);
  return { sessionId, token, sid };
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

const uploadSingleImage = async (req, res, errorMessage) => {
  if (!req.files.length) {
    return sendError(res, errorMessage);
  }
  const uploader = async (path) => await cloudinary.uploads(path, "Images");
  const file = req.files[0];
  const { path } = file;
  const image = await uploader(path);
  fs.unlinkSync(path);
  return image;
};

const uploadMultipleImages = async (req, res, errorMessage) => {
  if (!req.files.length) {
    return sendError(res, errorMessage);
  }
  const uploader = async (path) => await cloudinary.uploads(path, "Images");
  const images = [];
  const files = req.files;
  for (const file of files) {
    const { path } = file;
    const newPath = await uploader(path);
    images.push(newPath);
    fs.unlinkSync(path);
  }
  return images;
};

module.exports = {
  addSessionToken,
  getSessionToken,
  deleteSessionToken,

  createLoginSession,
  verifyLoginSession,
  logoutSession,

  uploadSingleImage,
  uploadMultipleImages,
};
