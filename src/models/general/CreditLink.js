const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    intent: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
    },
    loanReference: { type: String, required: true, unique: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true },
  },
  { timestamps: true },
);
// Immutable manual identity reconciliation. This is not payment confirmation.
module.exports =
  mongoose.models.CreditLink || mongoose.model("CreditLink", schema);
