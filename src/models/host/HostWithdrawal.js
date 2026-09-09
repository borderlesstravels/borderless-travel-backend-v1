const mongoose = require("mongoose");
const Double = require("@mongoosejs/double");
const Schema = mongoose.Schema;

const hostWithdrawalSchema = new Schema({
  owner: {
    type: String,
    required: true,
  },
  transaction_id: {
    type: String,
  },
  amount: {
    type: Double,
    required: true,
  },
  bank_details: {
    type: Object,
    required: true,
  },
  status: {
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

module.exports = mongoose.models.HostWithdrawal || mongoose.model("HostWithdrawal", hostWithdrawalSchema);