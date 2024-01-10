const multer = require('multer');

const careerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/files/docs/job-applications');
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.originalname.replace(/[^a-zA-Z0-9_.,]/g, '') +
        '_' +
        Date.now() +
        path.extname(file.originalname)
    );
  },
});
const carUpload = multer({ storage: careerStorage });
const careerAppDocUpload = carUpload.fields([{ name: 'documents', maxCount: 30 }]);

module.exports = {
  careerAppDocUpload,
};
