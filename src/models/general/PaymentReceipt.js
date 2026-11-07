const mongoose = require("mongoose");

// MongoDB's built-in unique _id index arbitrates concurrent payment claims.
// It does not depend on building a new unique index over legacy payment data.
const schema = new mongoose.Schema({
  _id: String,
  booking_reference: { type: String, required: true },
  service: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.models.PaymentReceipt || mongoose.model("PaymentReceipt", schema);
