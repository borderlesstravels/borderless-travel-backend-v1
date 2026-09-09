const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const resetAdminPasswordTokenSchema = new Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    expires: 600,
    default: Date.now,
  },
});

module.exports = mongoose.models.ResetAdminPasswordToken || mongoose.model('ResetAdminPasswordToken', resetAdminPasswordTokenSchema);