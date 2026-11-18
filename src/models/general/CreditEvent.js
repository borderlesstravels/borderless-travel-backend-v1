const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    keyHash: { type: String, required: true, unique: true },
    payloadHash: { type: String, required: true },
    event: { type: String, required: true },
    loanReference: { type: String, required: true, index: true },
    providerTransactionReference: String,
    occurredAt: { type: Date, required: true },
    customerEmail: String,
    currency: String,
    providerStatus: String,
    loanAmountMinor: String,
    // Informational provider field only. Never a settled payment record.
    reportedDisbursedMinor: String,
    reviewReason: String,
    disposition: {
      type: String,
      enum: ["application", "review_required"],
      required: true,
    },
  },
  { timestamps: true },
);
// Deliberately excludes form_data, identity documents, repayment details and raw bodies.
module.exports =
  mongoose.models.CreditEvent || mongoose.model("CreditEvent", schema);
