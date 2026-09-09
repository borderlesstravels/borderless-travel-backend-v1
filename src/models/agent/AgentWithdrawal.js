const mongoose = require("mongoose");
const Double = require("@mongoosejs/double");

const Schema = mongoose.Schema;

const agentWithdrawalSchema = new Schema({
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AgentApplication",
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
    default: {},
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

module.exports = mongoose.models.AgentWithdrawal || mongoose.model("AgentWithdrawal", agentWithdrawalSchema);