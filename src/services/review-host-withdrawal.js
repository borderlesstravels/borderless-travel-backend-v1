const mongoose = require("mongoose");
const Withdrawal = require("../models/host/HostWithdrawal");
const Balance = require("../models/host/HostBalance");
const Notification = require("../models/general/Notification");
const gateway = require("./paystack-transfers");
const { PaymentError, asNumber } = require("./payment-integrity");

function minorAmount(request) {
  const amount = asNumber(request.amount), minor = Math.round(amount * 100);
  if (!request.funds_reserved || !Number.isFinite(amount) || amount <= 0 ||
      !Number.isSafeInteger(minor) || minor < 1 || Math.abs(amount * 100 - minor) > 1e-7) {
    throw new PaymentError("Withdrawal balance reservation requires reconciliation", 409);
  }
  return minor;
}
function validateId(id) {
  if (typeof id !== "string" || !/^[a-f0-9]{24}$/i.test(id)) throw new PaymentError("Invalid withdrawal ID", 400);
}

async function rejectHostWithdrawal(id, admin, reason) {
  validateId(id);
  if (typeof reason !== "string" || !reason.trim() || reason.length > 1000) throw new PaymentError("Provide a rejection reason", 400);
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const request = await Withdrawal.findById(id).session(session);
      if (!request) throw new PaymentError("Withdrawal not found", 404);
      if (request.status === "rejected") { result = request; return; }
      if (request.status !== "pending" || request.transfer_reference) throw new PaymentError("Only an unprocessed withdrawal can be rejected", 409);
      minorAmount(request);
      const balance = await Balance.findOneAndUpdate({ owner: request.owner },
        { $inc: { available_balance: asNumber(request.amount) } }, { new: true, session });
      if (!balance) throw new PaymentError("Host balance requires reconciliation", 409);
      request.status = "rejected"; request.action_by = admin; request.rejection_reason = reason.trim();
      request.funds_reserved = false;
      await request.save({ session });
      await Notification.create([{ owner: request.owner, type: "withdrawal", title: "Withdrawal request rejected",
        // Admin free text is stored on the private request, not interpolated as HTML.
        description: "Your withdrawal request was rejected and its reserved funds were returned to your balance.",
      }], { session });
      result = request;
    });
    return result;
  } finally { await session.endSession(); }
}

async function approveHostWithdrawal(id, admin) {
  validateId(id);
  gateway.assertConfigured();
  let request = await Withdrawal.findById(id);
  if (!request) throw new PaymentError("Withdrawal not found", 404);
  if (request.status === "completed") return request;
  minorAmount(request);
  if (!["pending", "processing"].includes(request.status)) throw new PaymentError("Withdrawal cannot be approved in its current state", 409);
  if (request.status === "pending") {
    // Persist intent before ANY provider operation. One concurrent reviewer wins.
    request = await Withdrawal.findOneAndUpdate({ _id: id, status: "pending", funds_reserved: true,
      transfer_reference: { $exists: false } }, { $set: { status: "processing", action_by: admin,
      transfer_reference: `withdrawal_${id}`, transfer_started_at: new Date() } }, { new: true });
    if (!request) throw new PaymentError("Withdrawal is already being reviewed. Retry to reconcile its status.", 409);
    const bank = request.bank_details;
    if (typeof bank?.account_number !== "string" || typeof bank?.bank_data?.code !== "string") {
      throw new PaymentError("Saved bank details require reconciliation", 409);
    }
    const recipient = await gateway.createRecipient({ type: "nuban", name: bank.account_name,
      account_number: bank.account_number, bank_code: bank.bank_data.code, currency: "NGN" });
    if (typeof recipient?.recipient_code !== "string" || !recipient.recipient_code) throw new PaymentError("Recipient requires reconciliation", 502);
    request.recipient_code = recipient.recipient_code;
    await request.save();
    await gateway.initiateTransfer({ source: "balance", amount: minorAmount(request), recipient: request.recipient_code,
      currency: "NGN", reference: request.transfer_reference, reason: "Host withdrawal request" });
  }
  // Repeated approvals only verify. An uncertain POST must never be re-sent.
  if (!request.transfer_reference || !request.recipient_code) throw new PaymentError("Transfer requires manual reconciliation", 409);
  const transfer = await gateway.verifyTransfer(request.transfer_reference);
  if (transfer.reference !== request.transfer_reference || transfer.amount !== minorAmount(request) ||
      transfer.currency !== "NGN" || transfer.recipient?.recipient_code !== request.recipient_code) {
    throw new PaymentError("Transfer verification does not match the reserved withdrawal", 409);
  }
  if (transfer.status !== "success") {
    if (["pending", "otp", "received", "processing"].includes(transfer.status)) return request;
    throw new PaymentError("Transfer requires manual reconciliation before releasing funds", 409);
  }
  if (typeof transfer.transfer_code !== "string" || !transfer.transfer_code) throw new PaymentError("Transfer confirmation is incomplete", 409);
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const current = await Withdrawal.findById(id).session(session);
      if (current.status === "completed") { request = current; return; }
      if (current.status !== "processing" || current.transfer_reference !== transfer.reference ||
          minorAmount(current) !== transfer.amount || current.recipient_code !== transfer.recipient?.recipient_code) {
        throw new PaymentError("Withdrawal state requires reconciliation", 409);
      }
      const balance = await Balance.findOneAndUpdate({ owner: current.owner },
        { $inc: { total_withdrawals: asNumber(current.amount) } }, { new: true, session });
      if (!balance) throw new PaymentError("Host balance requires reconciliation", 409);
      current.status = "completed"; current.funds_reserved = false; current.transaction_id = transfer.transfer_code;
      await current.save({ session });
      await Notification.create([{ owner: current.owner, type: "withdrawal", title: "Withdrawal completed",
        description: "Your withdrawal transfer has been confirmed successful by the payment provider.",
      }], { session });
      request = current;
    });
    return request;
  } finally { await session.endSession(); }
}

module.exports = { approveHostWithdrawal, rejectHostWithdrawal };
