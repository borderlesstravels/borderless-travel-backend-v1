const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    requestKey: { type: String, required: true },
    contextHash: { type: String, required: true },
    // Unreserved search context only. No traveller documents or trusted payable amount.
    flightId: { type: String, required: true },
    origin: String,
    destination: String,
    departure: String,
  },
  { timestamps: true },
);
schema.index({ owner: 1, requestKey: 1 }, { unique: true });
module.exports =
  mongoose.models.CreditIntent || mongoose.model("CreditIntent", schema);
