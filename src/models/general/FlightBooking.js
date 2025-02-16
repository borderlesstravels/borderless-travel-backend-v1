const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const flightBookingSchema = new Schema({
  firm: {
    type: String,
    required: true,
  },
  api_key: {
    type: String,
    required: true,
  },
  owner: {
    type: String,
    // required: true,
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
  contact_email: {
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
  airline: {
    type: String,
    required: true,
  },
  airline_logo: {
    type: String,
    required: true,
  },
  departure_time: {
    type: Date,
    required: true,
  },
  arrival_time: {
    type: Date,
    required: true,
  },
  origin_code: {
    type: String,
    required: true,
  },
  destination_code: {
    type: String,
    required: true,
  },
  origin: {
    type: String,
    required: true,
  },
  destination: {
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
  payment_status: {
    type: String,
    required: true,
  },
  booking_reference: {
    type: String,
    required: true,
  },
  action_by: {
    type: String,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("FlightBooking", flightBookingSchema);
