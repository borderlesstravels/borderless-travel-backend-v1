const { sender_paystack } = require("./sender");

exports.createPaystackRecipient = async (data) =>
  sender_paystack("/transferrecipient", data);
exports.createPaystackTransfer = async (data) =>
  sender_paystack("/transfer", data);
