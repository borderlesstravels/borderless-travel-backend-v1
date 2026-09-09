const mongoose = require("mongoose");
const Double = require("@mongoosejs/double");
const Schema = mongoose.Schema;

const hostBalanceSchema = new Schema({
  owner: {
    type: String,
    required: true,
  },
  total_earnings: {
    type: Double,
    default: 0,
  },
  total_withdrawals: {
    type: Double,
    default: 0,
  },
  available_balance: {
    type: Double,
    default: 0,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.HostBalance || mongoose.model("HostBalance", hostBalanceSchema);