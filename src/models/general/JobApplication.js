const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const jobApplicationSchema = new Schema({
  jobId: {
    type: String,
    required: true,
  },
  first_name: {
    type: String,
    required: true,
  },
  last_name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  resume: {
    type: String,
    required: true,
  },
  cover: {
    type: String,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("JobApplication", jobApplicationSchema);
