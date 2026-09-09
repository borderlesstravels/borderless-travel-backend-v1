const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const dataSchema = new Schema({
  vehicle_provider: {
    type: String,
    required: true,
  },
  vehicle_name: {
    type: String,
    required: true,
  },
  vehicle_image: {
    type: Object,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  engine_type: {
    type: String,
    required: true,
  },
  doors: {
    type: String,
    required: true,
  },
  max_passengers_allowed: {
    type: String,
    required: true,
  },
  max_baggages_allowed: {
    type: String,
    required: true,
  },
  vehicle_terms: {
    type: Array,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  minimum_price: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    rdefault: "active",
  },
  action_by: {
    type: String,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.TransferVehicle || mongoose.model("TransferVehicle", dataSchema);