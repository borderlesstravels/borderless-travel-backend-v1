const mongoose = require("mongoose");
const Allocation = require("../models/general/CreditAllocation");
const Funding = require("../models/general/CreditFundingReview");
const Fare = require("../models/general/CreditFareReview");
const Intent = require("../models/general/CreditIntent");
const Link = require("../models/general/CreditLink");
const Event = require("../models/general/CreditEvent");
const User = require("../models/user/User");
const Booking = require("../models/general/FlightBooking");
const Sale = require("../models/general/SaleRecord");
const Payment = require("../models/general/Payment");
const Receipt = require("../models/general/PaymentReceipt");
const { hash, nairaToMinor, applicationStatus, text } = require("./gotrip");
const { PaymentError, asNumber } = require("./payment-integrity");
const fail = (message, status = 409) => {
  throw new PaymentError(message, status);
};
const minor = (value) => nairaToMinor(asNumber(value));
async function proof(allocation, booking, payment, session) {
  if (
    !allocation ||
    String(allocation.booking) !== String(booking._id) ||
    allocation.firm !== booking.firm ||
    allocation.bookingReference !== booking.booking_reference ||
    allocation.amountMinor !== minor(booking.price) ||
    booking.currency !== "NGN"
  )
    fail("Credit allocation does not match booking");
  const funding = await Funding.findById(allocation.funding).session(
    session || null,
  );
  const intent = await Intent.findById(allocation.intent).session(
    session || null,
  );
  const user = await User.findById(allocation.owner).session(session || null);
  const link = await Link.findOne({ intent: allocation.intent }).session(
    session || null,
  );
  const events = await Event.find({
    loanReference: allocation.providerReference,
  }).session(session || null);
  if (
    !funding ||
    !intent ||
    !user ||
    String(user.status).toLowerCase() === "blocked" ||
    String(intent.owner) !== String(user._id) ||
    user.email !== booking.owner ||
    booking.contact_details?.c_email !== user.email ||
    booking.source_offer_id !== intent.flightId ||
    String(funding.intent) !== String(intent._id) ||
    funding.providerReference !== allocation.providerReference ||
    funding.amountMinor !== allocation.amountMinor ||
    funding.currency !== "NGN" ||
    link?.loanReference !== allocation.providerReference ||
    applicationStatus(events) !== "approved_awaiting_funding"
  )
    fail("Credit funding evidence requires reconciliation");
  const approved = events.find(
    (event) =>
      event.event === "loan.approved" && event.disposition === "application",
  );
  if (
    approved?.currency !== "NGN" ||
    approved.loanAmountMinor !== allocation.amountMinor ||
    (approved.reportedDisbursedMinor &&
      approved.reportedDisbursedMinor !== allocation.amountMinor)
  )
    fail("Credit approval amount does not match allocation");
  if (
    payment &&
    (payment.funding_source !== "gotrip" ||
      payment.credit_allocation !== allocation._id ||
      payment.transaction_reference !== `gotrip:${funding._id}` ||
      minor(payment.amount_paid) !== allocation.amountMinor ||
      payment.currency !== "NGN" ||
      payment.owner !== user.email ||
      payment.payer_email !== user.email ||
      payment.booking_reference !== booking.booking_reference ||
      payment.service_name !== "flight" ||
      payment.status !== "completed")
  )
    fail("Credit payment requires reconciliation");
  return { funding, user };
}
async function validateCreditPayment(booking, payment) {
  const allocation = await Allocation.findById(payment.credit_allocation);
  await proof(allocation, booking, payment);
  const receipt = await Receipt.findById(
    hash(`gotrip:${allocation.providerReference}`),
  );
  if (
    receipt?.funding_source !== "gotrip" ||
    receipt.credit_allocation !== allocation._id ||
    receipt.booking_reference !== booking.booking_reference ||
    receipt.service !== "flight"
  )
    fail("Credit receipt requires reconciliation");
  return allocation;
}
async function allocateCredit({ intentId, bookingReference, userId, firm }) {
  if (process.env.GOTRIP_ACCOUNTING_ENABLED !== "true")
    fail("Credit allocation is not enabled", 503);
  if (
    !mongoose.isValidObjectId(intentId) ||
    !mongoose.isValidObjectId(userId) ||
    !text(bookingReference, 200) ||
    !text(firm, 200)
  )
    fail("Invalid credit allocation request", 400);
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const intent = await Intent.findOne({
        _id: intentId,
        owner: userId,
      }).session(session);
      if (!intent) fail("Selection not found", 404);
      const funding = await Funding.findOne({ intent: intentId }).session(
        session,
      );
      if (!funding) fail("Bank funding review is required");
      const bookings = await Booking.find({
        firm,
        booking_reference: bookingReference,
      })
        .limit(2)
        .session(session);
      if (bookings.length !== 1) fail("Booking missing or duplicated");
      const booking = bookings[0];
      const id = hash(`gotrip-allocation:${funding._id}`),
        existing = await Allocation.findById(id).session(session);
      if (existing) {
        const payment = await Payment.findOne({
          credit_allocation: id,
          funding_source: "gotrip",
        }).session(session);
        await proof(existing, booking, payment, session);
        if (!payment || booking.payment_status !== "paid")
          fail("Allocation records require reconciliation");
        result = { booking, allocation: existing, replay: true };
        return;
      }
      if (
        booking.payment_status === "paid" ||
        !["booked", "reserved", "pending"].includes(booking.status)
      )
        fail("Booking is already paid or inactive");
      if (
        !booking.departure_time ||
        new Date(booking.departure_time) <= new Date()
      )
        fail("Flight departure has passed or is unavailable");
      const fare = await Fare.findOne({ intent: intentId })
        .sort({ createdAt: -1, _id: -1 })
        .session(session);
      if (
        !fare ||
        fare.outcome !== "matched" ||
        fare.currency !== "NGN" ||
        fare.expiresAt <= new Date() ||
        fare.flightId !== intent.flightId ||
        fare.amountMinor !== funding.amountMinor ||
        fare.fundingMinor !== funding.amountMinor
      )
        fail(
          "A fresh matched fare check is required; resolve fare differences first",
        );
      const allocation = new Allocation({
        _id: id,
        intent: intentId,
        funding: funding._id,
        booking: booking._id,
        firm,
        bookingReference,
        owner: userId,
        amountMinor: funding.amountMinor,
        currency: "NGN",
        providerReference: funding.providerReference,
        fareReview: fare._id,
        actionBy: userId,
      });
      const { user } = await proof(allocation, booking, null, session);
      if (
        await Payment.exists({
          booking_reference: bookingReference,
          service_name: "flight",
        }).session(session)
      )
        fail("Booking already has a payment record");
      const sales = await Sale.find({
        sale_reference: bookingReference,
        purchasing_firm: firm,
        service: "flight",
      })
        .limit(2)
        .session(session);
      if (sales.length !== 1) fail("Booking sale requires reconciliation");
      const sale = sales[0];
      if (sale.status !== "pending")
        fail("Sale status requires reconciliation");
      const total = BigInt(allocation.amountMinor),
        cost = BigInt(minor(sale.service_cost)),
        profit = BigInt(minor(sale.profit));
      if (
        minor(sale.total_paid) !== allocation.amountMinor ||
        cost + profit !== total ||
        cost < 0n ||
        profit < 0n
      )
        fail("Sale pricing does not balance");
      await allocation.save({ session });
      await Receipt.create(
        [
          {
            _id: hash(`gotrip:${allocation.providerReference}`),
            booking_reference: bookingReference,
            service: "flight",
            funding_source: "gotrip",
            credit_allocation: id,
          },
        ],
        { session },
      );
      await Payment.create(
        [
          {
            owner: user.email,
            service_name: "flight",
            payer_name: `${user.first_name} ${user.last_name}`,
            payer_email: user.email,
            booking_reference: bookingReference,
            transaction_reference: `gotrip:${funding._id}`,
            amount_paid: Number(total) / 100,
            currency: "NGN",
            service_amount: Number(cost) / 100,
            commission_percent: (Number(profit) * 100) / Number(total),
            commission_amount: Number(profit) / 100,
            transaction_time: funding.receivedAt.toISOString(),
            funding_source: "gotrip",
            credit_allocation: id,
            action_by: String(userId),
          },
        ],
        { session },
      );
      booking.payment_status = "paid";
      sale.status = "completed";
      await booking.save({ session });
      await sale.save({ session });
      result = { booking, allocation, replay: false };
    });
    return result;
  } catch (error) {
    if (error.code === 11000)
      fail("Allocation already claimed; retry the same selection and booking");
    throw error;
  } finally {
    await session.endSession();
  }
}
module.exports = { allocateCredit, validateCreditPayment };
async function reserveCreditBooking({ intentId, userId, firm, apiKey, body }) {
  if (process.env.GOTRIP_ACCOUNTING_ENABLED !== "true")
    fail("Credit allocation is not enabled", 503);
  const Reservation = require("../models/general/CreditReservation");
  const {
    createFlightBooking,
    attemptKey,
  } = require("./create-flight-booking");
  if (!mongoose.isValidObjectId(intentId))
    fail("Invalid credit selection", 400);
  const intent = await Intent.findOne({ _id: intentId, owner: userId });
  const user = await User.findById(userId);
  if (!intent || !user || String(user.status).toLowerCase() === "blocked")
    fail("Selection not found", 404);
  if (body?.contact_details?.c_email !== user.email)
    fail("Use the signed-in customer's contact email", 403);
  const key = attemptKey(firm, intent.flightId, body);
  let reservation = await Reservation.findById(intentId);
  if (
    reservation &&
    (reservation.bodyHash !== key || reservation.firm !== firm)
  )
    fail(
      "This selection already has a reservation attempt with different details. Contact support before retrying.",
    );
  if (reservation?.bookingReference)
    return allocateCredit({
      intentId,
      userId,
      firm,
      bookingReference: reservation.bookingReference,
    });
  const allocated = await Allocation.findOne({ intent: intentId });
  if (allocated)
    return allocateCredit({
      intentId,
      userId,
      firm,
      bookingReference: allocated.bookingReference,
    });
  const funding = await Funding.findOne({ intent: intentId }),
    link = await Link.findOne({ intent: intentId });
  const events = link
    ? await Event.find({ loanReference: link.loanReference })
    : [];
  const fare = await Fare.findOne({ intent: intentId }).sort({
    createdAt: -1,
    _id: -1,
  });
  if (
    !funding ||
    !link ||
    applicationStatus(events) !== "approved_awaiting_funding" ||
    !fare ||
    fare.outcome !== "matched" ||
    fare.currency !== "NGN" ||
    fare.expiresAt <= new Date() ||
    fare.flightId !== intent.flightId ||
    fare.amountMinor !== funding.amountMinor ||
    fare.fundingMinor !== funding.amountMinor
  )
    fail(
      "Reviewed funds and a fresh matched fare are required before reservation",
    );
  if (!reservation) {
    try {
      reservation = await Reservation.create({
        _id: String(intentId),
        bodyHash: key,
        firm,
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      reservation = await Reservation.findById(intentId);
      if (reservation?.bodyHash !== key || reservation?.firm !== firm)
        fail("Reservation already claimed; contact support");
    }
  }
  const booking = await createFlightBooking({
    firm,
    apiKey,
    offer: intent.flightId,
    body,
  });
  await Reservation.updateOne(
    { _id: String(intentId), bodyHash: key },
    { $set: { bookingReference: booking.booking_reference } },
  );
  try {
    return await allocateCredit({
      intentId,
      userId,
      firm,
      bookingReference: booking.booking_reference,
    });
  } catch (error) {
    error.bookingReference = booking.booking_reference;
    throw error;
  }
}
module.exports.reserveCreditBooking = reserveCreditBooking;
