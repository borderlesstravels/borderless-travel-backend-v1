const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const dataSchema = new Schema({
  city: {
    type: String,
    required: true,
  },
  city_code: {
    type: String,
    required: true,
  },
  airport_name: {
    type: String,
    required: true,
  },
  airport_code: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  action_by: {
    type: String,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("TransferLocation", dataSchema);
