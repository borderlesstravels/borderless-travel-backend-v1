const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    intent: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
    },
    providerReference: { type: String, required: true, unique: true },
    bankReference: { type: String, required: true, unique: true },
    amountMinor: { type: String, required: true },
    currency: { type: String, enum: ["NGN"], required: true },
    receivedAt: { type: Date, required: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true },
    evidenceHash: { type: String, required: true },
  },
  { timestamps: true },
);
// Staff-reviewed bank evidence, not a Paystack receipt or automatic ticket permission.
module.exports =
  mongoose.models.CreditFundingReview ||
  mongoose.model("CreditFundingReview", schema);
