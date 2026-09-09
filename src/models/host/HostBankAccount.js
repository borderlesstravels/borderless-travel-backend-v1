const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const hostBankAccountSchema = new Schema({
  owner: {
    type: String,
    required: true,
  },
  account_name: {
    type: String,
    required: true,
  },
  account_number: {
    type: String,
    required: true,
  },
  bank_data: {
    type: Object,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.HostBankAccount || mongoose.model("HostBankAccount", hostBankAccountSchema);