const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const bookingRequestSchema = new Schema({
  company_name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  contact_person: {
    type: String,
    required: true,
  },
  business_reg_number: {
    type: String,
    required: true,
  },
  business_address: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "pending",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.BookingRequest || mongoose.model("BookingRequest", bookingRequestSchema);