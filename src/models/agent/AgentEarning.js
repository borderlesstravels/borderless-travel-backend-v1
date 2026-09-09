const mongoose = require("mongoose");
const Double = require("@mongoosejs/double");

const Schema = mongoose.Schema;

const agentEarningSchema = new Schema({
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AgentApplication",
    required: true,
  },
  booking_reference: {
    type: String,
    required: true,
  },
  service: {
    type: String,
    default: "flight",
  },
  amount: {
    type: Double,
    required: true,
  },
  customer_name: {
    type: String,
    required: true,
  },
  customer_email: {
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

agentEarningSchema.index({ agent: 1, booking_reference: 1 }, { unique: true });

module.exports = mongoose.models.AgentEarning || mongoose.model("AgentEarning", agentEarningSchema);