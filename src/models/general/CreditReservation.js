const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    _id: String,
    bodyHash: { type: String, required: true },
    firm: { type: String, required: true },
    bookingReference: String,
  },
  { timestamps: true },
);
module.exports =
  mongoose.models.CreditReservation ||
  mongoose.model("CreditReservation", schema);
