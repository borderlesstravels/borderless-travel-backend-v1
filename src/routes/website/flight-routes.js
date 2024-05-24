const express = require('express');
const {
  fetchAirports,
  fetchAirlines,
  flightOfferSearch,
  confirmFlightPrice,
  bookFlight,
  fetchFlightTicketDetails,
} = require('../../controllers/website/flight-controller');
const {
  validateFlightOfferSearch,
  validateFlightBooking,
  validate,
} = require('../../middlewares/validator');
const { verifyUserLoginToken } = require('../../controllers/website/user-auth-controller');

const router = express.Router();

router.get('/fetch-airports', fetchAirports);
router.get('/fetch-airlines', fetchAirlines);
router.post('/flight-offer-search', validateFlightOfferSearch, validate, flightOfferSearch);
router.get('/confirm-price/:flight_id', confirmFlightPrice);
router.post(
  '/book-flight/:flight_id',
  validateFlightBooking,
  validate,
  verifyUserLoginToken,
  bookFlight
);
router.get(
  '/flight-booking-details/:booking_reference',
  verifyUserLoginToken,
  fetchFlightTicketDetails
);

module.exports = router;
