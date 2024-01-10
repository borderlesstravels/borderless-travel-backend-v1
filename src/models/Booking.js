const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const bookingSchema = new Schema({
  owner: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  client_name: {
    type: String,
    required: true,
  },
  client_phone: {
    type: String,
    required: true,
  },
  client_email: {
    type: String,
    required: true,
  },
  contact_name: {
    type: String,
    required: true,
  },
  contact_phone: {
    type: String,
    required: true,
  },
  contact_relationship: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  booking_reference: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Booking', bookingSchema);
