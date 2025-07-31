const mongoose = require("mongoose");
const Double = require("@mongoosejs/double");
const Schema = mongoose.Schema;

const saleRecordSchema = new Schema({
  sale_reference: {
    type: String,
    required: true,
  },
  service: {
    type: String,
    required: true,
  },
  service_provider: {
    type: String,
    required: true,
  },
  purchasing_firm: {
    type: String,
    required: true,
  },
  total_paid: {
    type: Double,
    required: true,
  },
  service_cost: {
    type: Double,
    required: true,
  },
  profit: {
    type: Double,
    required: true,
  },
  status: {
    type: String,
    default: "pending",
  },
  action_by: {
    type: String,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("SaleRecord", saleRecordSchema);
