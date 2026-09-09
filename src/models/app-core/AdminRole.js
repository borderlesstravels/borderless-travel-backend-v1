const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const adminRoleSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.AdminRole || mongoose.model('AdminRole', adminRoleSchema);