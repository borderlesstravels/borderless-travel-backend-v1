const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  _id: String,
  booking_reference: String,
  firm: String,
  state: { type: String, required: true },
  action_by: String,
  created_at: { type: Date, default: Date.now },
});
module.exports = mongoose.models.TicketIssueAttempt || mongoose.model("TicketIssueAttempt", schema);
