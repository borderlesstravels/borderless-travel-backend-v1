const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const apiTokenSchema = new Schema({
  firm: {
    type: String,
    required: true,
  },
  api_key: {
    type: String,
    required: true,
  },
  commission: {
    type: Number,
    required: true,
    default: 0,
  },
  action_by: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("APIToken", apiTokenSchema);
