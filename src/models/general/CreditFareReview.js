const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    intent: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, required: true },
    flightId: { type: String, required: true },
    amountMinor: String,
    fundingMinor: { type: String, required: true },
    currency: { type: String, enum: ["NGN"], required: true },
    outcome: {
      type: String,
      enum: ["matched", "shortfall", "surplus", "unavailable", "invalid_quote"],
      required: true,
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);
// Append-only quote evidence. A fare check never reserves, pays or issues a flight.
module.exports =
  mongoose.models.CreditFareReview ||
  mongoose.model("CreditFareReview", schema);
