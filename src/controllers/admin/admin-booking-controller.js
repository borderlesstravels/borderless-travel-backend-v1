const { log } = require("console");
const { sender_tiqwa } = require("../../api/sender");
const {
  sendError,
  sendSuccess,
  verifyAPIToken,
  dateFormatter,
  timeFormatter,
} = require("../../utils/helpers");
const FlightBooking = require("../../models/general/FlightBooking");
const { fetcher_tiqwa } = require("../../api/fetcher");
const Payment = require("../../models/general/Payment");
const ShortletBooking = require("../../models/general/ShortletBooking");
const TransferBooking = require("../../models/general/TransferBooking");

//
// Flight
//
const allFlightBookings = async (req, res) => {
  if (!req.id) return sendError(res, "Admin authentication required", 401);
  const { firm, api_key } = req.headers;
  if (!(await verifyAPIToken(res, firm, api_key))) return;
  const bookings = await FlightBooking.find({ firm }).select("-api_key").limit(Math.min(100, Math.max(1, Number(req.query.limit) || 50)));
  return sendSuccess(res, "Successfully fetched flight bookings", bookings);
};

const singleFlightBooking = async (req, res) => {
  if (!req.id) return sendError(res, "Admin authentication required", 401);
  const { firm, api_key } = req.headers;
  if (!(await verifyAPIToken(res, firm, api_key))) return;
  const booking = await FlightBooking.findOne({ _id: req.params.id, firm }).select("-api_key");
  if (!booking) return sendError(res, "Booking not found", 404);
  return sendSuccess(res, "Successfully fetched flight booking", booking);
};

async function adminFlight(req, res) {
  if (!req.id) { sendError(res, "Admin authentication required", 401); return null; }
  const { firm, api_key } = req.headers;
  if (!(await verifyAPIToken(res, firm, api_key))) return null;
  const reference = req.params.booking_reference;
  if (typeof reference !== "string" || !reference || reference.length > 200) { sendError(res, "Invalid booking reference", 400); return null; }
  const bookings = await FlightBooking.find({ firm, booking_reference: reference }).limit(2);
  if (!bookings.length) { sendError(res, "Booking not found", 404); return null; }
  if (bookings.length !== 1) { sendError(res, "Duplicate booking records require reconciliation", 409); return null; }
  return bookings[0];
}

const fetchTicketDetails = async (req, res) => {
  const booking = await adminFlight(req, res);
  if (!booking) return;
  const response = await fetcher_tiqwa(`/flight/${encodeURIComponent(booking.booking_reference)}`);
  if (response?.status !== 200 || response.data?.reference !== booking.booking_reference) return sendError(res, "Unable to verify ticket details", 502);
  return sendSuccess(res, "Successfully fetched ticket details", response.data);
};

const issueFlightTicket = async (req, res, next) => {
  const booking = await adminFlight(req, res);
  if (!booking) return;
  try {
    const result = await require("../../services/issue-flight-ticket").issueFlightTicket({
      firm: booking.firm, reference: booking.booking_reference, admin: req.id,
    });
    if (result.replay || req.path.startsWith("/flight-tp/")) {
      return sendSuccess(res, "Ticket issuance confirmed", { booking_reference: booking.booking_reference, status: result.booking.status });
    }
    const current = result.booking;
    req.body = { first_name: current.contact_details?.c_first_name, email: current.contact_details?.c_email,
      booking_reference: current.booking_reference, flight: current.airline, destination: current.destination,
      route: `${current.origin} - ${current.destination}`, date: dateFormatter(current.departure_time), time: timeFormatter(current.departure_time) };
    return next();
  } catch (error) {
    return sendError(res, error.status ? error.message : "Ticket issuance requires reconciliation before retrying", error.status || 503);
  }
};

const cancelFlightTicket = async (req, res) => {
  if (!(await adminFlight(req, res))) return;
  // The old handler only changed a local flag; it never cancelled the provider
  // reservation. Do not send a false cancellation email or imply a refund.
  return sendError(res, "Cancellation requires provider confirmation and refund review. Contact support; no cancellation has been submitted.", 409);
};

const fetchBookingPayemnt = async (req, res) => {
  const booking = await adminFlight(req, res);
  if (!booking) return;
  const payment = await Payment.findOne({ booking_reference: booking.booking_reference, service_name: "flight" });
  if (!payment) return sendError(res, "Payment not found", 404);
  return sendSuccess(res, "Successfully fetched payment details", payment);
};

const fetchFlightReconciliation = async (req, res) => {
  const booking = await adminFlight(req, res);
  if (!booking) return;
  const report = await require("../../services/flight-reconciliation").flightReconciliation(booking);
  return sendSuccess(res, "Flight reconciliation report", report);
};

const reconcileFlightPayment = async (req, res) => {
  const booking = await adminFlight(req, res);
  if (!booking) return;
  try {
    const result = await require("../../services/record-payment").recordPayment({ service: "flight", firm: booking.firm,
      bookingReference: booking.booking_reference, transactionReference: req.body.transaction_reference });
    // Only record a verified payment. This endpoint never issues a ticket,
    // creates a provider reservation, cancels a flight or initiates a refund.
    return sendSuccess(res, result.replay ? "Payment already recorded" : "Verified payment recorded", {
      booking_reference: booking.booking_reference, payment_status: result.booking.payment_status, replay: result.replay,
    });
  } catch (error) {
    return sendError(res, error.status ? error.message : "Payment reconciliation unavailable", error.status || 503);
  }
};
const allShortletBookings = async (req, res) => {
  const { firm, api_key } = req.headers;
  if (!(await verifyAPIToken(res, firm, api_key))) return;
  try {
    const shortletBookings = await ShortletBooking.find({ firm }).limit(
      req.query.limit,
    );
    if (!shortletBookings) {
      return sendError(res, "Shortlet bookings not available at this time.");
    } else {
      return sendSuccess(
        res,
        "Successfully fetched all shortlet bookings",
        shortletBookings,
      );
    }
  } catch (error) {
    return sendError(res, "Cannot fetch shortlet bookings");
  }
};

const singleShortletBooking = async (req, res) => {
  const { firm, api_key } = req.headers;
  if (!(await verifyAPIToken(res, firm, api_key))) return;
  try {
    const shortletBooking = await ShortletBooking.findById(req.params.id);
    if (!shortletBooking) {
      return sendSuccess(res, "No shortlet booking record found");
    }
    if (shortletBooking.api_key !== api_key)
      return sendError(
        res,
        "Unauthorised! You are not authorised to perform this request",
      );
    return sendSuccess(res, "Successfully fetched booking", shortletBooking);
  } catch (error) {
    return sendError(res, "Cannot fetch shortlet bookings");
  }
};

// TRANSFERS
const allTransferBookings = async (req, res) => {
  try {
    const data = await TransferBooking.find();
    return sendSuccess(res, "Successfully fetched the data", data);
  } catch (error) {
    return sendError(res, "Cannot fetch vehicles data");
  }
};
const singleTransferBooking = async (req, res) => {
  try {
    const data = await TransferBooking.findById(req.params.id);
    if (!data) {
      return sendSuccess(res, "No transfer booking record found");
    }
    return sendSuccess(res, "Successfully fetched booking", data);
  } catch (error) {
    return sendError(res, "Cannot fetch shortlet bookings");
  }
};
const confirmTransferBooking = async (req, res, next) => {
  const adminId = req.id;
  const { booking_reference } = req.params;
  const booking = await TransferBooking.findOne({ booking_reference });
  if (!booking) {
    return sendError(
      res,
      "Invalid booking reference provided. Booking doesn't exist",
    );
  }

  try {
    booking.status = "confirmed";
    booking.action_by = adminId;
    await booking.save();
    // req.body = {
    //   first_name: booking.client_name.split(" ")[0],
    //   email: booking.client_email,
    //   booking_reference,
    //   flight: booking.airline,
    //   destination: booking.destination,
    //   route: `${booking.origin} - ${booking.destination}`,
    //   date: booking.date,
    //   time: booking.time,
    // };
    // next();
    return sendSuccess(res, "Booking successfully confirmed!");
  } catch (error) {
    console.log("Confirm booking error: ", error);
    return sendError(res, "Unable to confirm booking!");
  }
};

const cancelTransferBooking = async (req, res, next) => {
  const adminId = req.id;
  const { booking_reference } = req.params;
  const booking = await TransferBooking.findOne({ booking_reference });
  if (!booking) {
    return sendError(
      res,
      "Invalid booking reference provided. Booking doesn't exist",
    );
  }
  try {
    booking.status = "cancelled";
    booking.action_by = adminId;
    await booking.save();
    return sendSuccess(res, "Booking has now been cancelled!");
  } catch (error) {
    console.log("Can booking error: ", error);
    return sendError(res, "Unable to cancel booking!");
  }
};

module.exports = {
  allFlightBookings,
  singleFlightBooking,
  fetchTicketDetails,
  issueFlightTicket,
  cancelFlightTicket,
  fetchBookingPayemnt,
  fetchFlightReconciliation,
  reconcileFlightPayment,

  allShortletBookings,
  singleShortletBooking,

  allTransferBookings,
  singleTransferBooking,
  confirmTransferBooking,
  cancelTransferBooking,
};
