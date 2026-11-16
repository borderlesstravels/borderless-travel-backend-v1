const crypto = require("crypto");
const mongoose = require("mongoose");
const Payment = require("../models/general/Payment");
const Receipt = require("../models/general/PaymentReceipt");
const FlightBooking = require("../models/general/FlightBooking");
const ShortletBooking = require("../models/general/ShortletBooking");
const SaleRecord = require("../models/general/SaleRecord");
const Markup = require("../models/app-core/Markup");
const HostBalance = require("../models/host/HostBalance");
const HostEarning = require("../models/host/HostEarning");
const { PaymentError, asNumber, validateTransaction, verifyPaystack } = require("./payment-integrity");

async function recordPayment({ service, firm, bookingReference, transactionReference, user }) {
  const Model = service === "flight" ? FlightBooking : ShortletBooking;
  const filter = { booking_reference: bookingReference, firm };
  // Existing flight checkout supports guests. A guest must prove payment via
  // Paystack's verified metadata + customer + amount; the public API key alone
  // never proves payment. Shortlets always require an authenticated owner.
  if (service === "shortlet") {
    if (!user) throw new PaymentError("Please login first", 401);
    filter.owner = user.email;
  }
  const booking = await Model.findOne(filter);
  if (!booking) throw new PaymentError("Booking not found", 404);
  const verified = await verifyPaystack(transactionReference);
  validateTransaction(verified, booking, transactionReference);
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const current = await Model.findOne(filter).session(session);
      if (!current) throw new PaymentError("Booking not found", 404);
      validateTransaction(verified, current, transactionReference);
      const existing = await Payment.findOne({ transaction_reference: transactionReference }).session(session);
      if (existing) {
        if (existing.booking_reference !== bookingReference || existing.service_name !== service) {
          throw new PaymentError("Payment reference has already been used", 409);
        }
        if (current.payment_status !== "paid") {
          throw new PaymentError("Payment records require reconciliation. Contact support.", 409);
        }
        result = { booking: current, replay: true };
        return;
      }
      if (current.payment_status === "paid") throw new PaymentError("Booking is already paid", 409);
      if (service === "shortlet" && current.status !== "confirmed") {
        throw new PaymentError("Apartment availability is not confirmed", 409);
      }
      const markup = await Markup.findOne({ service_name: service }).session(session);
      if (!markup) throw new PaymentError("Service pricing configuration unavailable", 503);
      const amount = verified.amount / 100;
      const commissionPercent = asNumber(markup.commission);
      if (!Number.isFinite(commissionPercent) || commissionPercent < 0 || commissionPercent > 100) {
        throw new PaymentError("Service pricing configuration invalid", 503);
      }
      let sale;
      if (service === "flight") {
        sale = await SaleRecord.findOne({ sale_reference: bookingReference, purchasing_firm: firm }).session(session);
        if (!sale) throw new PaymentError("Booking sale record requires reconciliation", 409);
      }
      const commission = service === "flight" ? asNumber(sale.profit)
        : Math.round(amount * commissionPercent) / 100;
      if (!Number.isFinite(commission) || commission < 0 || commission > amount) {
        throw new PaymentError("Booking pricing requires reconciliation", 409);
      }
      const serviceAmount = Math.round((amount - commission) * 100) / 100;
      const receiptId = crypto.createHash("sha256").update(`paystack:${transactionReference}`).digest("hex");
      await Receipt.create([{ _id: receiptId, booking_reference: bookingReference, service }], { session });
      const contact = current.contact_details;
      await Payment.create([{
        owner: current.owner, service_name: service,
        payer_name: contact ? `${contact.c_first_name} ${contact.c_last_name}` : current.name,
        payer_email: verified.customer.email, booking_reference: bookingReference,
        transaction_reference: transactionReference, amount_paid: amount,
        currency: verified.currency,
        service_amount: serviceAmount, commission_percent: commissionPercent,
        commission_amount: commission, transaction_time: verified.paid_at,
      }], { session });
      current.payment_status = "paid";
      if (service === "flight") {
        sale.status = "completed";
        await sale.save({ session });
      } else {
        current.status = "paid";
        await SaleRecord.create([{
          purchasing_firm: firm, sale_reference: bookingReference, service,
          service_provider: process.env.SHORTLET_SERVICE_PROVIDER || "shortlet",
          total_paid: amount, service_cost: serviceAmount, profit: commission, status: "completed",
        }], { session });
        await HostEarning.create([{
          owner: current.apartment_owner, purchasing_firm: firm,
          transaction_id: transactionReference, property: current.apartment_name,
          amount: serviceAmount, details: `Earning from booking ${bookingReference}`,
        }], { session });
        const balance = await HostBalance.updateOne({ owner: current.apartment_owner }, {
          $inc: { total_earnings: serviceAmount, available_balance: serviceAmount },
        }, { session });
        if (balance.matchedCount !== 1) throw new PaymentError("Host account requires reconciliation", 409);
      }
      await current.save({ session });
      result = { booking: current, replay: false };
    });
    return result;
  } catch (error) {
    if (error.code === 11000) throw new PaymentError("Payment is already being processed. Retry with the same reference.", 409);
    throw error;
  } finally {
    await session.endSession();
  }
}

module.exports = { recordPayment };
