const express = require("express");

const {
  verifyAdminLoginToken,
} = require("../../controllers/admin/admin-auth-controller");
const {
  issueFlightTicket,
  cancelFlightTicket,
  allFlightBookings,
  singleFlightBooking,
  fetchTicketDetails,
  fetchBookingPayemnt,
} = require("../../controllers/admin/admin-booking-controller");

const router = express.Router();

router.get("/flight/all-bookings", verifyAdminLoginToken, allFlightBookings);
router.get(
  "/flight/single-booking/:id",
  verifyAdminLoginToken,
  singleFlightBooking
);
router.get(
  "/flight/ticket-details/:booking_reference",
  verifyAdminLoginToken,
  fetchTicketDetails
);
router.get(
  "/flight/booking-payment-details/:booking_reference",
  verifyAdminLoginToken,
  fetchBookingPayemnt
);
router.post(
  "/flight/issue-ticket/:booking_reference",
  verifyAdminLoginToken,
  issueFlightTicket
);
router.post(
  "/flight/cancel-ticket/:booking_reference",
  verifyAdminLoginToken,
  cancelFlightTicket
);

// Third party apps
router.get("/flight-tp/all-bookings", allFlightBookings);
router.get("/flight-tp/single-booking/:id", singleFlightBooking);
router.get("/flight-tp/ticket-details/:booking_reference", fetchTicketDetails);
router.get(
  "/flight-tp/booking-payment-details/:booking_reference",
  fetchBookingPayemnt
);
router.post("/flight-tp/issue-ticket/:booking_reference", issueFlightTicket);
router.post("/flight-tp/cancel-ticket/:booking_reference", cancelFlightTicket);

module.exports = router;
