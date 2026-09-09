const mongoose = require("mongoose");
const Double = require("@mongoosejs/double");
const Schema = mongoose.Schema;

const flightBookingSchema = new Schema({
  owner: {
    type: String,
    required: true,
  },
  firm: {
    type: String,
    required: true,
  },
  api_key: {
    type: String,
    required: true,
  },
  contact_details: {
    type: Object,
    required: true,
  },
  passenger_details: {
    type: Array,
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
  trip_type: {
    type: String,
    enum: ["one-way", "return", "multi-city"],
  },
  is_multicity: {
    type: Boolean,
    default: false,
  },
  price: {
    type: Double,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  payment_status: {
    type: String,
    default: "pending",
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

module.exports = mongoose.models.FlightBooking || mongoose.model("FlightBooking", flightBookingSchema);