const express = require("express");
const router = express.Router();

const {
  validate,
  validateShortletParams,
} = require("../../middlewares/validator");
const {
  allTransferVehicles,
  singleTransferVehicleDetails,
  fetchAllLocations,
  fetchVehiclesByLocation,
  bookTransfer,
  userAirportTransferBookings,
  userBookingByRefrence,
} = require("../../controllers/website/transfer-controller");
const { bookingCreatedEmail } = require("../../services/emailServices");

router.get("/fetch-locations", fetchAllLocations);
router.get("/fetch-vehicles", allTransferVehicles);
router.get("/vehicle-details/:id", singleTransferVehicleDetails);
router.get("/vehicles-by-city/:city", fetchVehiclesByLocation);
router.post("/book-transfer/:vehicle_id", bookTransfer, bookingCreatedEmail);
router.get("/transfer-booking/:booking_reference", userBookingByRefrence);
router.get("/transfer-bookings/:email", userAirportTransferBookings);

module.exports = router;
