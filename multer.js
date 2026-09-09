const multer = require("multer");

/**
 * Memory storage for Vercel (ephemeral filesystem).
 * Controllers upload buffers to Cloudinary.
 */
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/webp"
  ) {
    cb(null, true);
  } else {
    cb({ message: "Unsupported file type" }, false);
  }
};

const fileUpload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 7 },
  fileFilter,
});

module.exports = fileUpload;
