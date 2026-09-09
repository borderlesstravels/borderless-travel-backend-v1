const multer = require("multer");
const path = require("path");

/**
 * Memory storage for serverless (Vercel). Files are uploaded to Cloudinary.
 */
const memoryStorage = multer.memoryStorage();

const sanitizeBase = (originalname) =>
  originalname.replace(/[^a-zA-Z0-9_.,]/g, "");

const withFilename = (req, file, cb) => {
  cb(
    null,
    sanitizeBase(file.originalname) +
      "_" +
      Date.now() +
      path.extname(file.originalname),
  );
};

// Attach a stable filename for controllers that still read file.filename
const storage = {
  _handleFile(req, file, cb) {
    memoryStorage._handleFile(req, file, (err, info) => {
      if (err) return cb(err);
      withFilename(req, file, (_e, filename) => {
        file.filename = filename;
        cb(null, { ...info, filename });
      });
    });
  },
  _removeFile(req, file, cb) {
    memoryStorage._removeFile(req, file, cb);
  },
};

const imageFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/webp"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported image type"), false);
  }
};

const docFilter = (req, file, cb) => {
  const allowed = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported document type"), false);
  }
};

const limits = { fileSize: 1024 * 1024 * 10 };

const careerAppDocUpload = multer({
  storage,
  limits,
  fileFilter: docFilter,
}).fields([{ name: "files", maxCount: 5 }]);

const jobPostAppDocUpload = multer({
  storage,
  limits,
  fileFilter: imageFilter,
}).fields([{ name: "job_cover", maxCount: 1 }]);

const postImageUpload = multer({
  storage,
  limits,
  fileFilter: imageFilter,
}).fields([{ name: "cover_image", maxCount: 1 }]);

const adminImageUpload = multer({
  storage,
  limits,
  fileFilter: imageFilter,
}).fields([{ name: "avatar", maxCount: 1 }]);

const userImageUpload = multer({
  storage,
  limits,
  fileFilter: imageFilter,
}).fields([{ name: "avatar", maxCount: 1 }]);

const hostImageUpload = multer({
  storage,
  limits,
  fileFilter: imageFilter,
}).fields([{ name: "avatar", maxCount: 1 }]);

const shortletImageUpload = multer({
  storage,
  limits,
  fileFilter: imageFilter,
}).fields([{ name: "images", maxCount: 50 }]);

module.exports = {
  careerAppDocUpload,
  jobPostAppDocUpload,
  postImageUpload,
  adminImageUpload,
  userImageUpload,
  hostImageUpload,
  shortletImageUpload,
};
