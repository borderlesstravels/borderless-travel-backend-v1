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
  fetchFlightReconciliation,
  reconcileFlightPayment,
  allShortletBookings,
  singleShortletBooking,
  allTransferBookings,
  singleTransferBooking,
  confirmTransferBooking,
  cancelTransferBooking,
} = require("../../controllers/admin/admin-booking-controller");
const {
  flightTicketIssuedEmail,
  flightTicketCancelledEmail,
} = require("../../services/emailServices");

const router = express.Router();

router.get("/flight/reconciliation/:booking_reference", verifyAdminLoginToken, fetchFlightReconciliation);
router.post("/flight/reconcile-payment/:booking_reference", verifyAdminLoginToken, reconcileFlightPayment);

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
  issueFlightTicket,
  flightTicketIssuedEmail
);
router.post(
  "/flight/cancel-ticket/:booking_reference",
  verifyAdminLoginToken,
  cancelFlightTicket,
  flightTicketCancelledEmail
);

// Third party apps
// Legacy aliases are administrative operations, not public-key authorization.
// Partners use the receipt-scoped website ticket route for customer reads.
router.use("/flight-tp", verifyAdminLoginToken);
router.get("/flight-tp/all-bookings", allFlightBookings);
router.get("/flight-tp/single-booking/:id", singleFlightBooking);
router.get("/flight-tp/ticket-details/:booking_reference", fetchTicketDetails);
router.get(
  "/flight-tp/booking-payment-details/:booking_reference",
  fetchBookingPayemnt
);
router.post("/flight-tp/issue-ticket/:booking_reference", issueFlightTicket);
router.post("/flight-tp/cancel-ticket/:booking_reference", cancelFlightTicket);

//
// Shortlet bookings
//
router.get(
  "/shortlet/all-bookings",
  verifyAdminLoginToken,
  allShortletBookings
);
router.get(
  "/shortlet/single-booking/:id",
  verifyAdminLoginToken,
  singleShortletBooking
);

// TRANSFERS
router.get(
  "/transfer/all-bookings",
  verifyAdminLoginToken,
  allTransferBookings
);
router.get(
  "/transfer/single-booking/:id",
  verifyAdminLoginToken,
  singleTransferBooking
);
router.put(
  "/transfer/confirm-booking/:booking_reference",
  confirmTransferBooking
);
router.put(
  "/transfer/cancel-booking/:booking_reference",
  cancelTransferBooking
);
module.exports = router;
