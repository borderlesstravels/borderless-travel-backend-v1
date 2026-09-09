const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const contentCategorySchema = new Schema({
  published_by: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.ContentCategory || mongoose.model('ContentCategory', contentCategorySchema);