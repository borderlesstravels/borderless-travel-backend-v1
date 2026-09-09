const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const jobSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  requirements: {
    type: Array,
    required: true,
  },
  responsibilities: {
    type: Array,
    required: true,
  },
  experience: {
    type: String,
    default: true,
  },
  salary: {
    type: String,
  },
  open: {
    type: Boolean,
    default: true,
  },
  vacancies: {
    type: Number,
    default: true,
  },
  job_cover: {
    type: String,
    default: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.Job || mongoose.model("Job", jobSchema);