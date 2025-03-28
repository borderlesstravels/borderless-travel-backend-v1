const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const subscriberSchema = new Schema({
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
  phone: {
    type: String,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Subscriber", subscriberSchema);
