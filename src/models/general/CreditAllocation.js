const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    _id: String,
    intent: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
    },
    funding: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
    },
    firm: { type: String, required: true },
    bookingReference: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, required: true },
    amountMinor: { type: String, required: true },
    currency: { type: String, enum: ["NGN"], required: true },
    providerReference: { type: String, required: true },
    fareReview: { type: mongoose.Schema.Types.ObjectId, required: true },
    actionBy: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true },
);
module.exports =
  mongoose.models.CreditAllocation ||
  mongoose.model("CreditAllocation", schema);
