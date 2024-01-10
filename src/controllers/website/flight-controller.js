const { log } = require('console');
const { fetcher_tiqwa } = require('../../api/fetcher');
const { sender_tiqwa } = require('../../api/sender');
const Booking = require('../../models/Booking');
const { sendError } = require('../../utils/helpers');
const User = require('../../models/user/User');

const fetchAirports = async (req, res) => {
  const response = await fetcher_tiqwa('/airports');
  if (response?.status === 200) {
    return res.status(response.status).json({ success: true, data: response.data });
  } else {
    return sendError(res, response?.data.message, response?.status);
  }
};

const fetchAirlines = async (req, res) => {
  const response = await fetcher_tiqwa('/airports');
  if (response?.status === 200) {
    return res.status(response.status).json({ success: true, data: response.data });
  } else {
    return sendError(res, response?.data.message, response?.status);
  }
};

const flightOfferSearch = async (req, res, next) => {
  const response = await fetcher_tiqwa('/flight/search', req.body);
  if (response?.status === 200) {
    return res.status(response.status).json({ success: true, data: response.data });
  } else {
    return sendError(res, response?.data.message, response?.status);
  }
};

const confirmFlightPrice = async (req, res) => {
  const { flight_id } = req.params;
  const response = await fetcher_tiqwa(`/flight/confirm_price/${flight_id}`);
  if (response?.status === 200) {
    return res.status(response.status).json({ success: true, data: response.data });
  } else {
    return sendError(res, response?.data.message, response?.status);
  }
};

const bookFlight = async (req, res) => {
  const { flight_id } = req.params;
  const userId = req.id;
  const { contact_details, passenger_details } = req.body;
  const client = passenger_details[0];
  const client_name = `${client.first_name} ${client.last_name}`;
  const client_phone = client.phone_number;
  const client_email = client.email;
  log('flight_id', flight_id);
  log('client', client);

  const user = await User.findById(userId, '-password');
  console.log(user);
  if (!user) return sendError(res, 'Sorry, please login first');

  const response = await sender_tiqwa(`/flight/book/${flight_id}`, {
    passengers: passenger_details,
  });
  log('response', response.data);
  if (response?.status === 200) {
    const contactDetails = new Booking({
      owner: user._id,
      type: 'flight',
      client_name,
      client_phone,
      client_email,
      contact_name: contact_details.name,
      contact_phone: contact_details.phone,
      contact_relationship: contact_details.contact_relationship,
      price: response?.data?.amount,
      status: response?.data?.status,
      booking_reference: response?.data.reference,
    });
    await contactDetails.save();
    return res.status(response.status).json({ success: true, data: response.data });
  } else {
    return sendError(res, response?.data.message, response?.status);
  }
};

const payForFlight = async (req, res, next) => {
  const { document_required, contact_details, passenger_details } = req.body;
};

const fetchFlightBooking = async (req, res) => {
  const { booking_reference } = req.params;
  const response = await fetcher_tiqwa(`/flight/${booking_reference}`);
  log('response', response.data);
  if (response?.status === 200) {
    return res.status(response.status).json({ success: true, data: response.data });
  } else {
    return sendError(res, response?.data.message, response?.status);
  }
};

module.exports = {
  fetchAirports,
  fetchAirlines,
  flightOfferSearch,
  confirmFlightPrice,
  bookFlight,
  fetchFlightBooking,
};
