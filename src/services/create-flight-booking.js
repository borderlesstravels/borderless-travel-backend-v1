const crypto = require("crypto");
const mongoose = require("mongoose");
const Attempt = require("../models/general/BookingAttempt");
const FlightBooking = require("../models/general/FlightBooking");
const SaleRecord = require("../models/general/SaleRecord");
const { sender_tiqwa } = require("../api/sender");
const { PaymentError, asNumber } = require("./payment-integrity");

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, canonical(value[key])]),
  );
  return value;
}

function attemptKey(firm, offer, body) {
  return crypto.createHash("sha256").update(JSON.stringify(canonical({ firm, offer, body }))).digest("hex");
}

async function createFlightBooking({ firm, apiKey, offer, body }) {
  const key = attemptKey(firm, offer, body);
  let attempt;
  try {
    attempt = await Attempt.create({ _id: key, state: "provider_pending" });
  } catch (error) {
    if (error.code !== 11000) throw error;
    attempt = await Attempt.findById(key);
    if (attempt?.state === "completed") {
      const booking = await FlightBooking.findById(attempt.booking_id);
      if (!booking) throw new PaymentError("Booking requires reconciliation. Contact support.", 409);
      return booking;
    }
    if (attempt?.state !== "provider_confirmed") {
      throw new PaymentError("This booking is processing or its provider result is uncertain. Contact support before retrying.", 409);
    }
  }
  if (attempt.state === "provider_pending") {
    // No automatic POST retries. A timeout may mean the provider made a booking.
    const response = await sender_tiqwa(`/flight/book/${encodeURIComponent(offer)}`, { passengers: body.passenger_details });
    if (response?.status !== 200 || !response.data?.reference) {
      throw new PaymentError("Booking could not be confirmed. Contact support before trying again.", 502);
    }
    const p = response.data;
    const segments = Array.isArray(p.outbound) && p.outbound.length ? p.outbound
      : (p.routes || []).flatMap((route) => Array.isArray(route.segments) ? route.segments : []);
    // Record provider success durably BEFORE attempting local booking/sale writes.
    attempt.provider_reference = p.reference;
    attempt.provider_result = { segments, amount: p.amount, pricing: p.pricing,
      currency: p.currency || "NGN", status: p.status,
      is_multicity: Boolean(p.is_multicity), has_inbound: Boolean(p.inbound?.length) };
    attempt.state = "provider_confirmed";
    await attempt.save();
  }
  const provider = attempt.provider_result;
  const first = provider.segments?.[0];
  const last = provider.segments?.at(-1);
  if (!first || !last) throw new PaymentError(`Booking requires reconciliation. Reference: ${attempt.provider_reference}`, 409);
  const session = await mongoose.startSession();
  let booking;
  try {
    await session.withTransaction(async () => {
      const current = await Attempt.findById(key).session(session);
      if (current.state === "completed") {
        booking = await FlightBooking.findById(current.booking_id).session(session);
        if (!booking) throw new PaymentError("Booking requires reconciliation. Contact support.", 409);
        return;
      }
      const contact = body.contact_details;
      [booking] = await FlightBooking.create([{
        owner: contact.c_email, firm, api_key: apiKey,
        contact_details: contact, passenger_details: body.passenger_details,
        contact_relationship: contact.c_relationship_to_p,
        airline: first.airline_details?.name, airline_logo: first.airline_details?.logo,
        departure_time: first.departure_time, arrival_time: last.arrival_time,
        origin_code: first.airport_from, destination_code: last.airport_to,
        // Airport catalogue lookup must never block persistence after booking.
        origin: first.airport_from, destination: last.airport_to,
        trip_type: provider.is_multicity ? "multi-city" : provider.has_inbound ? "return" : "one-way",
        is_multicity: provider.is_multicity, payment_status: "pending",
        currency: provider.currency, price: asNumber(provider.amount),
        status: provider.status, booking_reference: current.provider_reference,
      }], { session });
      await SaleRecord.create([{
        purchasing_firm: firm, sale_reference: current.provider_reference,
        service: "flight", service_provider: process.env.FLIGHT_SERVICE_PROVIDER || "tiqwa",
        total_paid: asNumber(provider.amount), service_cost: asNumber(provider.pricing?.payable),
        profit: asNumber(provider.pricing?.markup?.markup_value),
      }], { session });
      current.state = "completed";
      current.booking_id = booking._id;
      await current.save({ session });
    });
    return booking;
  } finally { await session.endSession(); }
}

module.exports = { createFlightBooking, attemptKey };
