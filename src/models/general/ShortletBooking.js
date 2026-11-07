const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const shortletBookingSchema = new Schema({
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
  apartment_id: {
    type: String,
    required: true,
  },
  apartment_name: {
    type: String,
    required: true,
  },
  apartment_img: {
    type: Object,
    required: true,
  },
  gps_location: {
    type: String,
  },
  apartment_address: {
    type: String,
    required: true,
  },
  apartment_city: {
    type: String,
    required: true,
  },
  apartment_state: {
    type: String,
    required: true,
  },
  apartment_country: {
    type: String,
    required: true,
  },
  apartment_owner: {
    type: String,
    required: true,
  },
  name: {
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
  check_in_date: {
    type: Date,
    required: true,
  },
  check_out_date: {
    type: Date,
    required: true,
  },
  check_in_time: {
    type: String,
  },
  number_of_days: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    default: "pending",
  },
  payment_status: {
    type: String,
    default: "pending",
  },
  currency: { type: String, default: "NGN" },
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

module.exports = mongoose.models.ShortletBooking || mongoose.model("ShortletBooking", shortletBookingSchema);
