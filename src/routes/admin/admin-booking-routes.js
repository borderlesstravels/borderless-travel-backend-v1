const express = require('express');

const { verifyAdminLoginToken } = require('../../controllers/admin/admin-auth-controller');
const {
  issueFlightTicket,
  fetchSingleBooking,
  fetchAllBookings,
} = require('../../controllers/admin/admin-booking-controller');

const router = express.Router();

router.get('/fetch-all-bookings', verifyAdminLoginToken, fetchAllBookings);
router.get('/fetch-single-booking/:id', verifyAdminLoginToken, fetchSingleBooking);
router.post('/issue-flight-ticket/:booking_reference', verifyAdminLoginToken, issueFlightTicket);

module.exports = router;
