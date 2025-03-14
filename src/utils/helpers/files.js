const multer = require("multer");
const path = require("path");

const careerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/files/docs/job-applications");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.originalname.replace(/[^a-zA-Z0-9_.,]/g, "") +
        "_" +
        Date.now() +
        path.extname(file.originalname)
    );
  },
});
const carUpload = multer({ storage: careerStorage });
const careerAppDocUpload = carUpload.fields([{ name: "files", maxCount: 5 }]);

const jobPostStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/files/docs/job-applications");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.originalname.replace(/[^a-zA-Z0-9_.,]/g, "") +
        "_" +
        Date.now() +
        path.extname(file.originalname)
    );
  },
});
const jobPostUpload = multer({ storage: jobPostStorage });
const jobPostAppDocUpload = jobPostUpload.fields([
  { name: "job_cover", maxCount: 1 },
]);

const postStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/files/imgs/posts");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.originalname.replace(/[^a-zA-Z0-9_.,]/g, "") +
        "_" +
        Date.now() +
        path.extname(file.originalname)
    );
  },
});
const postUpload = multer({ storage: postStorage });
const postImageUpload = postUpload.fields([
  { name: "cover_image", maxCount: 1 },
]);

// Admin avatar
const adminStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/files/imgs/admins");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.originalname.replace(/[^a-zA-Z0-9_.,]/g, "") +
        "_" +
        Date.now() +
        path.extname(file.originalname)
    );
  },
});
const adminUpload = multer({ storage: adminStorage });
const adminImageUpload = adminUpload.fields([{ name: "avatar", maxCount: 1 }]);

// User
const userStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/files/imgs/users");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.originalname.replace(/[^a-zA-Z0-9_.,]/g, "") +
        "_" +
        Date.now() +
        path.extname(file.originalname)
    );
  },
});
const userUpload = multer({ storage: userStorage });
const userImageUpload = userUpload.fields([{ name: "avatar", maxCount: 1 }]);

// Host avatar
const hostStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/files/imgs/hosts");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.originalname.replace(/[^a-zA-Z0-9_.,]/g, "") +
        "_" +
        Date.now() +
        path.extname(file.originalname)
    );
  },
});
const hostUpload = multer({ storage: hostStorage });
const hostImageUpload = hostUpload.fields([{ name: "avatar", maxCount: 1 }]);

// Host shortlet
const shortletStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/files/imgs/shortlets");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.originalname.replace(/[^a-zA-Z0-9_.,]/g, "") +
        "_" +
        Date.now() +
        path.extname(file.originalname)
    );
  },
});
const shortletUpload = multer({ storage: shortletStorage });
const shortletImageUpload = shortletUpload.fields([
  { name: "images", maxCount: 50 },
]);

module.exports = {
  careerAppDocUpload,
  jobPostAppDocUpload,
  postImageUpload,
  adminImageUpload,
  userImageUpload,
  hostImageUpload,
  shortletImageUpload,
};
