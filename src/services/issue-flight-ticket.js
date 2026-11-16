const mongoose = require("mongoose");
const Booking = require("../models/general/FlightBooking");
const Payment = require("../models/general/Payment");
const Attempt = require("../models/general/TicketIssueAttempt");
const gateway = require("../api/fetcher");
const sender = require("../api/sender");
const {
  PaymentError,
  verifyPaystack,
  validateTransaction,
} = require("./payment-integrity");

async function issueFlightTicket({ firm, reference, admin }) {
  if (typeof reference !== "string" || !reference || reference.length > 200)
    throw new PaymentError("Invalid booking reference", 400);
  const bookings = await Booking.find({
    firm,
    booking_reference: reference,
  }).limit(2);
  if (!bookings.length) throw new PaymentError("Booking not found", 404);
  if (bookings.length !== 1)
    throw new PaymentError(
      "Duplicate booking records require reconciliation",
      409,
    );
  const booking = bookings[0];
  if (
    booking.payment_status !== "paid" ||
    ["cancelled", "canceled", "failed"].includes(booking.status)
  ) {
    throw new PaymentError("Only a paid, active booking can be ticketed", 409);
  }
  const payments = await Payment.find({
    booking_reference: reference,
    service_name: "flight",
  }).limit(2);
  if (payments.length !== 1)
    throw new PaymentError(
      "Payment requires reconciliation before ticketing",
      409,
    );
  const payment = payments[0];
  // A historical local paid flag is not proof of money received.
  if (payment.funding_source === "gotrip") {
    if (process.env.GOTRIP_TICKETING_ENABLED !== "true")
      throw new PaymentError("Credit ticketing is not enabled", 503);
    await require("./allocate-credit").validateCreditPayment(booking, payment);
  } else {
    validateTransaction(
      await verifyPaystack(payment.transaction_reference),
      booking,
      payment.transaction_reference,
    );
  }
  let attempt,
    claimed = false;
  try {
    attempt = await Attempt.create({
      _id: String(booking._id),
      firm,
      booking_reference: reference,
      state: "provider_pending",
      action_by: admin,
    });
    claimed = true;
  } catch (error) {
    if (error.code !== 11000) throw error;
    attempt = await Attempt.findById(String(booking._id));
    if (attempt?.state === "completed") {
      if (booking.status !== "issued")
        throw new PaymentError("Ticket records require reconciliation", 409);
      return { booking, replay: true };
    }
    if (!attempt)
      throw new PaymentError("Ticket issuance requires reconciliation", 409);
  }
  const readProvider = async () => {
    const response = await gateway.fetcher_tiqwa(
      `/flight/${encodeURIComponent(reference)}`,
    );
    if (response?.status !== 200 || response.data?.reference !== reference) {
      throw new PaymentError(
        "Ticket status requires provider reconciliation. Do not submit another issuance request.",
        502,
      );
    }
    if (
      payment.funding_source === "gotrip" &&
      (response.data.currency !== "NGN" ||
        require("./payment-integrity").minorUnits(response.data.amount) !==
          require("./payment-integrity").minorUnits(booking.price))
    ) {
      throw new PaymentError(
        "Provider reservation amount changed; reconcile before ticketing",
        409,
      );
    }
    return response.data;
  };
  let provider = await readProvider();
  if (provider.status !== "issued" && claimed) {
    if (!["booked", "reserved", "pending"].includes(provider.status))
      throw new PaymentError(
        "Provider booking is not eligible for ticketing",
        409,
      );
    const starting = await Attempt.findOneAndUpdate(
      { _id: attempt._id, state: "provider_pending" },
      { $set: { state: "pay_started" } },
      { new: true },
    );
    if (starting) {
      const response = await sender.sender_tiqwa(
        `/flight/pay/${encodeURIComponent(reference)}`,
      );
      if (response?.status !== 200)
        throw new PaymentError(
          "Ticket outcome is uncertain. Reconcile the existing booking before retrying.",
          502,
        );
    }
    provider = await readProvider();
  }
  if (provider.status !== "issued")
    throw new PaymentError(
      "Ticket issuance is pending or uncertain. Reconcile the existing booking.",
      409,
    );
  // A retry after a provider timeout performs GETs only. Never repeat pay POST.
  await Attempt.updateOne(
    {
      _id: attempt._id,
      state: { $in: ["provider_pending", "pay_started", "provider_confirmed"] },
    },
    { $set: { state: "provider_confirmed" } },
  );
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const current = await Attempt.findById(attempt._id).session(session);
      if (current.state === "completed") {
        result = {
          booking: await Booking.findById(booking._id).session(session),
          replay: true,
        };
        return;
      }
      const saved = await Booking.findOneAndUpdate(
        {
          _id: booking._id,
          firm,
          payment_status: "paid",
          status: { $in: ["pending", "reserved", "booked", "issued"] },
        },
        { $set: { status: "issued", action_by: admin } },
        { new: true, session },
      );
      if (!saved)
        throw new PaymentError("Local booking requires reconciliation", 409);
      current.state = "completed";
      await current.save({ session });
      result = { booking: saved, replay: false };
    });
    return result;
  } finally {
    await session.endSession();
  }
}

module.exports = { issueFlightTicket };
