const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const adminSchema = new Schema({
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
  phone: {
    type: String,
  },
  role: {
    type: String,
  },
  username: {
    type: String,
  },
  nationality: {
    type: String,
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

module.exports = mongoose.model('Admin', adminSchema);
