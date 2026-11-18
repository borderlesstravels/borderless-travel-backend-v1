const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    intent: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        "customer_contact",
        "fare_increase",
        "surplus",
        "unavailable",
        "manual_review",
      ],
      required: true,
    },
    reason: { type: String, required: true },
    actionBy: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true },
);
module.exports =
  mongoose.models.CreditReviewNote ||
  mongoose.model("CreditReviewNote", schema);
