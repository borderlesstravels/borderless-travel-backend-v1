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
    if (!flightBookings) {
      return sendError(res, "Flight bookings not available at this time.");
    } else {
      return sendSuccess(
        res,
        "Successfully fetched all flight bookings",
        flightBookings
      );
    }
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

const issueFlightTicket = async (req, res, next) => {
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
  } else {
    if (response?.status === 200) {
      try {
        const booking = await FlightBooking.findOne({ booking_reference });
        booking.status = "issued";
        booking.action_by = adminId ? adminId : api_key;
        await booking.save();

        const date = dateFormatter(booking?.departure_time);
        const time = timeFormatter(booking?.departure_time);
        req.body = {
          first_name: booking.client_name.split(" ")[0],
          email: booking.client_email,
          booking_reference,
          flight: booking.airline,
          destination: booking.destination,
          route: `${booking.origin} - ${booking.destination}`,
          date,
          time,
        };

        next();
      } catch (error) {
        console.log("Issue ticket action error: ", error);
        return sendError(
          res,
          "Ticket issued successfully. But the system could not update the booking record with new status",
          204
        );
      }
    } else {
      return sendError(res, response?.data.message, response?.status);
    }
  }
};

const cancelFlightTicket = async (req, res, next) => {
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

  try {
    const booking = await FlightBooking.findOne({ booking_reference });
    booking.status = "canceled";
    booking.action_by = adminId ? adminId : api_key;
    await booking.save();

    const date = dateFormatter(booking?.departure_time);
    req.body = {
      first_name: booking.client_name.split(" ")[0],
      email: booking.client_email,
      booking_reference,
      route: `${booking.origin} - ${booking.destination}`,
      date,
    };

    next();
  } catch (error) {
    console.log("Cancel ticket action error: ", error);
    return sendError(
      res,
      "Ticket canceled successfully. But the system could not update the booking record with new status",
      204
    );
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
    if (!shortletBookings) {
      return sendError(res, "Shortlet bookings not available at this time.");
    } else {
      return sendSuccess(
        res,
        "Successfully fetched all shortlet bookings",
        shortletBookings
      );
    }
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
