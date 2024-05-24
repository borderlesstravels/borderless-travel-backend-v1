const { log } = require('console');
const { sender_tiqwa } = require('../../api/sender');
const { sendError } = require('../../utils/helpers');
const FlightBooking = require('../../models/general/FlightBooking');
const { fetcher_tiqwa } = require('../../api/fetcher');

//
// Flight
//
const allFlightBookings = async (req, res) => {
  try {
    const flightBookings = await FlightBooking.find().limit(req.query.limit);
    if (flightBookings.length < 1) {
      return res.status(201).json({ success: true, message: 'No flight booking record found' });
    } else {
      log(flightBookings);
      return res.status(200).json({
        success: true,
        message: 'Successfully fetched all flight bookings',
        data: flightBookings,
      });
    }
  } catch (error) {
    return sendError(res, 'Cannot fetch flight bookings');
  }
};

const singleFlightBooking = async (req, res) => {
  try {
    const flightBooking = await FlightBooking.findById(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Successfully fetched all flight bookings',
      data: flightBooking,
    });
  } catch (error) {
    return sendError(res, 'Cannot fetch flight bookings');
  }
};

const fetchTicketDetails = async (req, res) => {
  const { booking_reference } = req.params;
  const response = await fetcher_tiqwa(`/flight/${booking_reference}`);
  log('response', response.data);
  if (!response) {
    return sendError(res, 'Unable to complete this request at this time. Please try again.');
  }
  if (response?.status === 200) {
    return res.status(response.status).json({ success: true, data: response.data });
  } else {
    return sendError(res, response?.data.message, response?.status);
  }
};

const issueFlightTicket = async (req, res) => {
  const adminId = req.id;
  const { booking_reference } = req.params;

  const response = await sender_tiqwa(`/flight/pay/${booking_reference}`);
  if (!response) {
    return sendError(res, 'Unable to complete this request at this time. Please try again.');
  }
  if (response?.status === 200) {
    try {
      const booking = await FlightBooking.findOne({ booking_reference });
      booking.status = 'issued';
      booking.action_by = adminId;
      await booking.save();
      return res.status(response.status).json({ success: true, data: response.data });
    } catch (error) {
      log(error);
      return sendError(
        res,
        'Ticket issued successfully. But the system could not update the booking record with new status',
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
  const response = await sender_tiqwa(`/flight/${booking_reference}`);
  if (!response) {
    return sendError(res, 'Unable to complete this request at this time. Please try again.');
  }
  console.log(response.status);

  if (response?.status === 200) {
    try {
      const booking = await FlightBooking.findOne({ booking_reference });
      booking.status = 'canceled';
      booking.action_by = adminId;
      await booking.save();
      return res.status(response.status).json({ success: true, data: response.data });
    } catch (error) {
      log(error);
      return sendError(
        res,
        'Ticket canceled successfully. But the system could not update the booking record with new status',
        204
      );
    }
  } else {
    return sendError(res, response?.data.message, response?.status);
  }
};

//
// Stays
//

module.exports = {
  allFlightBookings,
  singleFlightBooking,
  fetchTicketDetails,
  issueFlightTicket,
  cancelFlightTicket,
};
