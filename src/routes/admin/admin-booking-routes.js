const express = require('express');

const { verifyAdminLoginToken } = require('../../controllers/admin/admin-auth-controller');
const {
  issueFlightTicket,
  cancelFlightTicket,
  allFlightBookings,
  singleFlightBooking,
  fetchTicketDetails,
} = require('../../controllers/admin/admin-booking-controller');

const router = express.Router();

router.get('/flight/all-bookings', verifyAdminLoginToken, allFlightBookings);
router.get('/flight/single-booking/:id', verifyAdminLoginToken, singleFlightBooking);
router.get('/flight/ticket-details/:booking_reference', verifyAdminLoginToken, fetchTicketDetails);
router.post('/flight/issue-ticket/:booking_reference', verifyAdminLoginToken, issueFlightTicket);
router.post('/flight/cancel-ticket/:booking_reference', verifyAdminLoginToken, cancelFlightTicket);

module.exports = router;
