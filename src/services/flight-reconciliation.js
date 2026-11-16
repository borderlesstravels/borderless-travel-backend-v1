const crypto = require("crypto");
const Payment = require("../models/general/Payment");
const Receipt = require("../models/general/PaymentReceipt");
const Sale = require("../models/general/SaleRecord");
const Reservation = require("../models/general/BookingAttempt");
const Ticket = require("../models/general/TicketIssueAttempt");
const gateway = require("../api/fetcher");
const { verifyPaystack, validateTransaction, asNumber, minorUnits } = require("./payment-integrity");

async function flightReconciliation(booking) {
  const reference = booking.booking_reference;
  const [payments, sales, reservation, ticket] = await Promise.all([
    Payment.find({ booking_reference: reference, service_name: "flight" }).limit(2),
    Sale.find({ sale_reference: reference, purchasing_firm: booking.firm, service: "flight" }).limit(2),
    Reservation.findOne({ $or: [{ booking_id: booking._id }, { provider_reference: reference }] }).select("state"),
    Ticket.findById(String(booking._id)).select("state"),
  ]);
  const issues = [];
  let paymentVerification = payments.length ? "ambiguous" : "missing";
  let providerStatus = "unavailable", receipt = false;
  await Promise.all([
    (async () => {
      if (payments.length !== 1) return;
      try {
        validateTransaction(await verifyPaystack(payments[0].transaction_reference), booking, payments[0].transaction_reference);
        paymentVerification = "verified";
      } catch (error) { paymentVerification = error.status === 502 || error.status === 503 ? "unavailable" : "mismatch"; }
      const id = crypto.createHash("sha256").update(`paystack:${payments[0].transaction_reference}`).digest("hex");
      const claim = await Receipt.findById(id);
      receipt = claim?.service === "flight" && claim.booking_reference === reference;
      if (!receipt) issues.push("missing_atomic_payment_receipt");
    })(),
    (async () => {
      const response = await gateway.fetcher_tiqwa(`/flight/${encodeURIComponent(reference)}`);
      if (response?.status !== 200) return;
      if (response.data?.reference !== reference) { providerStatus = "mismatch"; return; }
      providerStatus = ["pending", "reserved", "booked", "issued", "cancelled", "canceled", "expired", "failed"].includes(response.data.status)
        ? response.data.status : "unknown";
    })(),
  ]);
  if (paymentVerification !== "verified") issues.push(`payment_${paymentVerification}`);
  if (booking.payment_status !== "paid" && paymentVerification === "verified") issues.push("verified_payment_not_recorded_as_paid");
  if (booking.payment_status === "paid" && providerStatus !== "issued") issues.push("paid_booking_not_confirmed_issued");
  if (providerStatus !== booking.status) issues.push("local_provider_status_difference");
  if (sales.length !== 1) issues.push("missing_or_duplicate_sale_records");
  else {
    try {
      const sale = sales[0], total = minorUnits(sale.total_paid);
      const rawCost = asNumber(sale.service_cost) * 100, rawProfit = asNumber(sale.profit) * 100;
      const cost = Math.round(rawCost), profit = Math.round(rawProfit);
      if (total !== minorUnits(booking.price) || !Number.isSafeInteger(cost) || cost < 0 ||
          !Number.isSafeInteger(profit) || profit < 0 || Math.abs(rawCost - cost) > 1e-7 ||
          Math.abs(rawProfit - profit) > 1e-7 || cost + profit !== total) issues.push("sale_amount_mismatch");
    } catch { issues.push("sale_amount_mismatch"); }
  }
  // Deliberately omit provider passengers, bank/customer payloads and API keys.
  return { booking_reference: reference, local_status: booking.status, payment_status: booking.payment_status,
    provider_status: providerStatus, payment_verification: paymentVerification, atomic_payment_receipt: receipt,
    reservation_attempt: reservation?.state || null, ticket_attempt: ticket?.state || null, issues };
}

module.exports = { flightReconciliation };
