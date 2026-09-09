const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const waitlistSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: [true, "You have already subscribed to our list with this email"],
  },
  first_name: {
    type: String,
  },
  last_name: {
    type: String,
  },
  city: {
    type: String,
  },
  country: {
    type: String,
  },
  phone: {
    type: String,
  },
  type: {
    type: String,
    default: "general",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.Waitlist || mongoose.model("Waitlist", waitlistSchema);