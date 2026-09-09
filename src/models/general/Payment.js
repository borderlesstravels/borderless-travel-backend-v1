const mongoose = require("mongoose");
const Double = require("@mongoosejs/double");
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
  owner: {
    type: String,
    required: true,
  },
  service_name: {
    type: String,
    required: true,
  },
  payer_name: {
    type: String,
    required: true,
  },
  payer_email: {
    type: String,
    required: true,
  },
  booking_reference: {
    type: String,
    required: true,
  },
  transaction_reference: {
    type: String,
    required: true,
  },
  amount_paid: {
    type: Double,
    required: true,
  },
  service_amount: {
    type: Double,
    required: true,
  },
  commission_percent: {
    type: Double,
    required: true,
  },
  commission_amount: {
    type: Double,
    required: true,
  },
  transaction_time: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "completed",
  },
  action_by: {
    type: String,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);