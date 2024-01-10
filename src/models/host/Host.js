const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const hostSchema = new Schema({
  hotel_name: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  lga: {
    type: String,
    required: true,
  },
  postal_code: {
    type: String,
    required: true,
  },
  hotel_address: {
    type: String,
    required: true,
  },
  hotel_email: {
    type: String,
    required: true,
  },
  hotel_phone: {
    type: String,
    required: true,
  },
  hotel_website: {
    type: String,
  },
  contact_first_name: {
    type: String,
    required: true,
  },
  contact_last_name: {
    type: String,
    required: true,
  },
  contact_email: {
    type: String,
    required: true,
  },
  contact_phone: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  email_verified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Host', hostSchema);
