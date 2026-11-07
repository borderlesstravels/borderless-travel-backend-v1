const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  _id: String,
  state: { type: String, required: true },
  provider_reference: String,
  provider_result: mongoose.Schema.Types.Mixed,
  booking_id: mongoose.Schema.Types.ObjectId,
  created_at: { type: Date, default: Date.now },
});
module.exports = mongoose.models.BookingAttempt || mongoose.model("BookingAttempt", schema);
