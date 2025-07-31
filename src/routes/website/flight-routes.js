const express = require("express");
const {
  fetchAirports,
  fetchAirlines,
  flightOfferSearch,
  confirmFlightPrice,
  fetchFlightTicketDetails,
  flightOfferSearchMultiCity,
  bookFlightThirdParty,
  travelBookingRequest,
  flightProviderWebHook,
  bookFlight,
} = require("../../controllers/website/flight-controller");
const {
  validateFlightOfferSearch,
  validateFlightBooking,
  validate,
  validateMultiCityFlightOfferSearch,
  validateBookingRequestParams,
} = require("../../middlewares/validator");
const {
  verifyUserLoginToken,
} = require("../../controllers/website/user-auth-controller");
const { bookingCreatedEmail } = require("../../services/emailServices");

const router = express.Router();

router.post(
  "/travel-booking-request",
  validateBookingRequestParams,
  validate,
  travelBookingRequest
);
router.get("/fetch-airports", fetchAirports);
router.get("/fetch-airlines", fetchAirlines);
router.post(
  "/flight-offer-search",
  validateFlightOfferSearch,
  validate,
  flightOfferSearch
);
router.post(
  "/multi-city-flight-offer-search",
  validateMultiCityFlightOfferSearch,
  validate,
  flightOfferSearchMultiCity
);
router.get("/confirm-price/:flight_id", confirmFlightPrice);
router.post(
  "/book-flight/:flight_id",
  validateFlightBooking,
  validate,
  bookFlight,
  bookingCreatedEmail
);

router.post(
  "/book-flight-tp/:flight_id",
  validateFlightBooking,
  validate,
  bookFlightThirdParty
);
router.get(
  "/flight-booking-details/:booking_reference",
  verifyUserLoginToken,
  fetchFlightTicketDetails
);

// manilla
router.get(
  "/flight-ticket-details/:booking_reference",
  fetchFlightTicketDetails
);

// Provider webhook
router.post("/tiqwa-webhook", flightProviderWebHook);

module.exports = router;
