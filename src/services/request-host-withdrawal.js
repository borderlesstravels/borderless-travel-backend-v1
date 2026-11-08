const mongoose = require("mongoose");
const Balance = require("../models/host/HostBalance");
const Withdrawal = require("../models/host/HostWithdrawal");
const BankAccount = require("../models/host/HostBankAccount");
const { PaymentError } = require("./payment-integrity");

async function requestHostWithdrawal(owner, amount, bankDetails) {
  // Reject coercion, negative/zero values, fractions of a kobo and unsafe amounts.
  const minor = Math.round(amount * 100);
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0 ||
      !Number.isSafeInteger(minor) || minor < 1 || Math.abs(amount * 100 - minor) > 1e-7) {
    throw new PaymentError("Provide a positive amount with at most two decimal places", 400);
  }
  if (typeof bankDetails?.account_number !== "string" || typeof bankDetails?.bank_data?.code !== "string") {
    throw new PaymentError("Select a saved bank account", 400);
  }
  const session = await mongoose.startSession();
  let withdrawal;
  try {
    await session.withTransaction(async () => {
      const account = await BankAccount.findOne({ owner,
        account_number: bankDetails.account_number, "bank_data.code": bankDetails.bank_data.code }).session(session);
      if (!account) throw new PaymentError("Saved bank account not found", 404);
      // Conditional debit serializes competing withdrawals. The withdrawal and
      // balance reserve commit together, or both roll back.
      const balance = await Balance.findOneAndUpdate({ owner, available_balance: { $gte: amount } },
        { $inc: { available_balance: -amount } }, { new: true, session });
      if (!balance) throw new PaymentError("Insufficient available balance", 409);
      [withdrawal] = await Withdrawal.create([{ owner, amount,
        bank_details: { account_name: account.account_name, account_number: account.account_number, bank_data: account.bank_data },
      }], { session });
    });
    return withdrawal;
  } finally { await session.endSession(); }
}

module.exports = { requestHostWithdrawal };
