const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const markupSchema = new Schema({
  service_name: {
    type: String,
    required: true,
  },
  api_provider: {
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
  },
  service_region: {
    type: String,
    required: true,
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

module.exports = mongoose.models.Markup || mongoose.model('Markup', markupSchema);