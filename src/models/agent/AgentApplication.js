const mongoose = require("mongoose");
const Double = require("@mongoosejs/double");

const Schema = mongoose.Schema;

const educationLevels = [
  "Secondary School",
  "Diploma/OND",
  "HND",
  "Bachelor's Degree",
  "Master's Degree",
  "Doctorate",
  "Other",
];

const applicationStatuses = [
  "pending",
  "under_review",
  "approved",
  "rejected",
  "suspended",
];

const agentApplicationSchema = new Schema({
  full_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 255,
    unique: [true, "An application with this email already exists"],
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30,
  },
  location: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
  },
  education: {
    type: String,
    required: true,
    enum: educationLevels,
  },
  status: {
    type: String,
    enum: applicationStatuses,
    default: "pending",
  },
  available_balance: {
    type: Double,
    default: 0,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("AgentApplication", agentApplicationSchema);
module.exports.educationLevels = educationLevels;
module.exports.applicationStatuses = applicationStatuses;
