const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  _id: String,
  count: { type: Number, required: true },
  expires_at: { type: Date, required: true, expires: 0 },
});
module.exports = mongoose.models.AuthRateBucket || mongoose.model("AuthRateBucket", schema);
