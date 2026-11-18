const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    captureKey: { type: String, required: true, unique: true },
    loanReference: { type: String, required: true, index: true },
    event: { type: String, required: true },
    receivedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true, expires: 0 },
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
    ciphertext: { type: String, required: true },
  },
  { timestamps: true },
);
module.exports =
  mongoose.models.CreditPayloadArchive ||
  mongoose.model("CreditPayloadArchive", schema);
