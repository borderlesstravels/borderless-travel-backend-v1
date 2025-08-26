const mongoose = require("mongoose");
const Double = require("@mongoosejs/double");
const Schema = mongoose.Schema;

const hostEarningSchema = new Schema({
  owner: {
    type: String,
    required: true,
  },
  purchasing_firm: {
    type: String,
    required: true,
  },
  transaction_id: {
    type: String,
    required: true,
  },
  property: {
    type: String,
    required: true,
  },
  amount: {
    type: Double,
    required: true,
  },
  details: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "completed",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("HostEarning", hostEarningSchema);
