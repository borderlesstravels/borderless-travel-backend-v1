const { log } = require('console');
const { fetcher_tiqwa } = require('../../api/fetcher');
const { sender_tiqwa } = require('../../api/sender');
const Booking = require('../../models/Booking');
const { sendError } = require('../../utils/helpers');

const fetchFlightBookingFromTiqwa = async (req, res) => {
  const { booking_reference } = req.params;
  const response = await fetcher_tiqwa(`/flight/${booking_reference}`);
  log('response', response.data);
  if (response?.status === 200) {
    return res.status(response.status).json({ success: true, data: response.data });
  } else {
    return sendError(res, response?.data.message, response?.status);
  }
};

const fetchAllBookings = async (req, res) => {
  try {
    const flightBookings = await Booking.find().limit(req.query.limit);
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

const fetchSingleBooking = async (req, res) => {
  try {
    const flightBooking = await Booking.findById(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Successfully fetched all flight bookings',
      data: flightBooking,
    });
  } catch (error) {
    return sendError(res, 'Cannot fetch flight bookings');
  }
};

const issueFlightTicket = async (req, res) => {
  const { booking_reference } = req.params;
  const response = await sender_tiqwa(`/flight/pay/${booking_reference}`);
  log('response', response.data);
  if (response?.status === 200) {
    return res.status(response.status).json({ success: true, data: response.data });
  } else {
    return sendError(res, response?.data.message, response?.status);
  }
};

module.exports = {
  fetchFlightBookingFromTiqwa,
  fetchAllBookings,
  fetchSingleBooking,
  issueFlightTicket,
};
