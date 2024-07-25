const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
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
  username: {
    type: String,
  },
  phone: {
    type: String,
  },
  referral_code: {
    type: String,
  },
  referred_by: {
    type: String,
  },
  status: {
    type: String,
    default: 'Pending',
  },
  priceAlert: {
    type: Boolean,
    default: true,
  },
  travelAlert: {
    type: Boolean,
    default: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  email_verified: {
    type: Boolean,
    default: false,
    required: true,
  },
  bookings: {
    type: Number,
    default: 0,
  },
  avatar: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
