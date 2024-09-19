const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const resetHostPasswordTokenSchema = new Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Host',
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

module.exports = mongoose.model('ResetHostPasswordToken', resetHostPasswordTokenSchema);
