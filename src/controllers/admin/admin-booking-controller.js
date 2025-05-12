const { log } = require("console");
const { sender_tiqwa } = require("../../api/sender");
const {
  sendError,
  sendSuccess,
  verifyAPIToken,
} = require("../../utils/helpers");
const FlightBooking = require("../../models/general/FlightBooking");
const { fetcher_tiqwa } = require("../../api/fetcher");
const Payment = require("../../models/general/Payment");
const APIToken = require("../../models/app-core/APIToken");
const ShortletBooking = require("../../models/general/ShortletBooking");

//
// Flight
//
const allFlightBookings = async (req, res) => {
  const { firm, api_key } = req.headers;
  await verifyAPIToken(res, firm, api_key);
  try {
    const flightBookings = await FlightBooking.find({ firm }).limit(
      req.query.limit
    );
    return sendSuccess(
      res,
      "Successfully fetched all flight bookings",
      flightBookings
    );
  } catch (error) {
    return sendError(res, "Cannot fetch flight bookings");
  }
};

const singleFlightBooking = async (req, res) => {
  const { firm, api_key } = req.headers;
  await verifyAPIToken(res, firm, api_key);
  try {
    const flightBooking = await FlightBooking.findById(req.params.id);
    if (!flightBooking) {
      return sendSuccess(res, "No flight booking record found");
    }
    if (flightBooking.api_key !== api_key)
      return sendError(
        res,
        "Unauthorised! You are not authorised to perform this request"
      );
    return sendSuccess(res, "Successfully fetched booking", flightBooking);
  } catch (error) {
    return sendError(res, "Cannot fetch flight bookings");
  }
};

const fetchTicketDetails = async (req, res) => {
  const { booking_reference } = req.params;
  const { firm, api_key } = req.headers;
  await verifyAPIToken(res, firm, api_key);

  const booking = await FlightBooking.findOne({ booking_reference });
  if (!booking)
    return sendError(
      res,
      "Invalid booking reference provided. Booking doesn't exist"
    );
  if (booking.api_key !== api_key)
    return sendError(
      res,
      "Unauthorised! You are not authorised to perform this request"
    );

  const response = await fetcher_tiqwa(`/flight/${booking_reference}`);
  log("response", response.data);
  if (!response) {
    return sendError(
      res,
      "Unable to complete this request at this time. Please try again."
    );
  }
  if (response?.status === 200) {
    return res
      .status(response.status)
      .json({ success: true, data: response.data });
  } else {
    return sendError(res, response?.data.message, response?.status);
  }
};

const issueFlightTicket = async (req, res) => {
  const adminId = req.id;
  const { booking_reference } = req.params;

  const { firm, api_key } = req.headers;
  await verifyAPIToken(res, firm, api_key);
  const booking = await FlightBooking.findOne({ booking_reference });
  if (!booking)
    return sendError(
      res,
      "Invalid booking reference provided. Booking doesn't exist"
    );
  if (booking.api_key !== api_key)
    return sendError(
      res,
      "Unauthorised! You are not authorised to perform this request"
    );

  const response = await sender_tiqwa(`/flight/pay/${booking_reference}`);
  if (!response) {
    return sendError(
      res,
      "Unable to complete this request at this time. Please try again."
    );
  }
  if (response?.status === 200) {
    try {
      const booking = await FlightBooking.findOne({ booking_reference });
      booking.status = "issued";
      booking.action_by = adminId ? adminId : api_key;
      await booking.save();
      return sendSuccess(
        res,
        "Ticket has been successfully issued",
        response.data
      );
    } catch (error) {
      log(error);
      return sendError(
        res,
        "Ticket issued successfully. But the system could not update the booking record with new status",
        204
      );
    }
  } else {
    return sendError(res, response?.data.message, response?.status);
  }
};

const cancelFlightTicket = async (req, res) => {
  const { booking_reference } = req.params;
  const adminId = req.id;

  const { firm, api_key } = req.headers;
  await verifyAPIToken(res, firm, api_key);
  const booking = await FlightBooking.findOne({ booking_reference });
  if (!booking)
    return sendError(
      res,
      "Invalid booking reference provided. Booking doesn't exist"
    );
  if (booking.api_key !== api_key)
    return sendError(
      res,
      "Unauthorised! You are not authorised to perform this request"
    );

  const response = await sender_tiqwa(`/flight/${booking_reference}`);
  if (!response) {
    return sendError(
      res,
      "Unable to complete this request at this time. Please try again."
    );
  }
  console.log(response.status);

  if (response?.status === 200) {
    try {
      const booking = await FlightBooking.findOne({ booking_reference });
      booking.status = "canceled";
      booking.action_by = adminId ? adminId : api_key;
      await booking.save();
      return sendSuccess(
        res,
        "Ticket has been successfully cancelled",
        response.data
      );
    } catch (error) {
      log(error);
      return sendError(
        res,
        "Ticket canceled successfully. But the system could not update the booking record with new status",
        204
      );
    }
  } else {
    return sendError(res, response?.data.message, response?.status);
  }
};

const fetchBookingPayemnt = async (req, res) => {
  const { booking_reference } = req.params;
  try {
    const bookingPayment = await Payment.findOne({
      booking_reference: booking_reference,
    });
    if (!bookingPayment) {
      return sendError(res, "Payment has not been made for this booking");
    }
    return sendSuccess(
      res,
      "Successfully fetched the booking payment details",
      bookingPayment
    );
  } catch (error) {
    console.log(error);
    return sendError(res, `Unable to fetch payment details. Error - ${error}`);
  }
};

//
// Stays
//
const allShortletBookings = async (req, res) => {
  const { firm, api_key } = req.headers;
  await verifyAPIToken(res, firm, api_key);
  try {
    const shortletBookings = await ShortletBooking.find({ firm }).limit(
      req.query.limit
    );
    return sendSuccess(
      res,
      "Successfully fetched all shortlet bookings",
      shortletBookings
    );
  } catch (error) {
    return sendError(res, "Cannot fetch shortlet bookings");
  }
};

const singleShortletBooking = async (req, res) => {
  const { firm, api_key } = req.headers;
  await verifyAPIToken(res, firm, api_key);
  try {
    const shortletBooking = await ShortletBooking.findById(req.params.id);
    if (!shortletBooking) {
      return sendSuccess(res, "No shortlet booking record found");
    }
    if (shortletBooking.api_key !== api_key)
      return sendError(
        res,
        "Unauthorised! You are not authorised to perform this request"
      );
    return sendSuccess(res, "Successfully fetched booking", shortletBooking);
  } catch (error) {
    return sendError(res, "Cannot fetch shortlet bookings");
  }
};

module.exports = {
  allFlightBookings,
  singleFlightBooking,
  fetchTicketDetails,
  issueFlightTicket,
  cancelFlightTicket,
  fetchBookingPayemnt,

  allShortletBookings,
  singleShortletBooking,
};
