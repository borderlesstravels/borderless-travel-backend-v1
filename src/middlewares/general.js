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
  try {
    const user = jwt.verify(String(token), secrete);
    if (!user?.id) {
      return false;
    }
    req.id = user.id;
    return true;
  } catch (err) {
    return false;
  }
};

const logoutSession = async (token, secrete) => {
  try {
    const user = jwt.verify(String(token), secrete);
    return Boolean(user);
  } catch (err) {
    console.log("logout error:", err.message || err);
    return false;
  }
};

/**
 * Normalize multer `array` (File[]) and `fields` ({ name: File[] }) shapes.
 */
const flattenMulterFiles = (files) => {
  if (!files) return [];
  if (Array.isArray(files)) return files;
  return Object.values(files).flat().filter(Boolean);
};

const uploadFileToCloudinary = async (file, folder = "Images") => {
  if (!file) return null;
  if (file.buffer) {
    return cloudinary.uploads(file, folder);
  }
  if (file.path) {
    const image = await cloudinary.uploads(file.path, folder);
    try {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    } catch (_) {
      /* ignore cleanup errors on ephemeral FS */
    }
    return image;
  }
  return null;
};

const uploadSingleImage = async (req) => {
  const files = flattenMulterFiles(req.files);
  if (!files.length) return null;
  return uploadFileToCloudinary(files[0], "Images");
};

const uploadMultipleImages = async (req) => {
  const files = flattenMulterFiles(req.files);
  if (!files.length) return null;
  const images = [];
  for (const file of files) {
    const uploaded = await uploadFileToCloudinary(file, "Images");
    if (uploaded) images.push(uploaded);
  }
  return images.length ? images : null;
};

const uploadDocuments = async (files, folder = "Documents") => {
  const list = flattenMulterFiles(files);
  if (!list.length) return null;
  const uploaded = [];
  for (const file of list) {
    const result = await uploadFileToCloudinary(file, folder);
    if (result) uploaded.push(result);
  }
  return uploaded.length ? uploaded : null;
};

module.exports = {
  addSessionToken,
  getSessionToken,
  deleteSessionToken,

  createLoginSession,
  verifyLoginSession,
  logoutSession,

  flattenMulterFiles,
  uploadFileToCloudinary,
  uploadSingleImage,
  uploadMultipleImages,
  uploadDocuments,
};
