const cloud = require("cloudinary");
const cloudinary = cloud.v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUDNAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a local path, data URI, or multer memory file to Cloudinary.
 * @param {string|object} file - path string, data URI, or { buffer, mimetype, originalname }
 * @param {string} folder
 */
exports.uploads = (file, folder = "Images") => {
  return new Promise((resolve, reject) => {
    const options = { folder, resource_type: "auto" };

    const finish = (error, result) => {
      if (error || !result) {
        return reject(error || new Error("Cloudinary upload failed"));
      }
      resolve({
        url: result.secure_url || result.url,
        id: result.public_id,
      });
    };

    if (file && typeof file === "object" && Buffer.isBuffer(file.buffer)) {
      const stream = cloudinary.uploader.upload_stream(options, finish);
      stream.end(file.buffer);
      return;
    }

    if (typeof file === "string") {
      cloudinary.uploader.upload(file, options, finish);
      return;
    }

    reject(new Error("Unsupported file payload for Cloudinary upload"));
  });
};
