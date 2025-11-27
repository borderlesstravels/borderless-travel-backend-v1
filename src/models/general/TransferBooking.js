const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const dataSchema = new Schema({
  booking_reference: {
    type: String,
    required: true,
  },
  vehicle_id: {
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
  owner: {
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
  origin: {
    type: String,
    required: true,
  },
  destination: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
  },
  status: {
    type: String,
    default: "pending",
  },
  payment_status: {
    type: String,
    default: "pending",
  },
  action_by: {
    type: String,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("TransferBooking", dataSchema);
