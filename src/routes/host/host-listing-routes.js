const express = require("express");
const upload = require("../../../multer");

const {
  verifyHostLoginToken,
} = require("../../controllers/website/host-auth-controller");

const {
  hostAddProperty,
  hostGetHostProperties,
  hostFetchSingleProperty,
  hostEditProperty,
  hostApproveShortletBooking,
  hostDeclineShortletBooking,
  hostFetchShortletBookings,
  hostFetchSingleShortletBooking,
  hostDeleteProperty,
  hostGetHostAvailableProperties,
  hostGetHostUnavailableProperties,
  hostMarkListingAsAvailable,
  hostMarkListingAsUnavailable,
} = require("../../controllers/host/host-listing-controller");
const { apartmentAvailableEmail } = require("../../services/emailServices");

const router = express.Router();

// Shortlet
router.post(
  "/add-listing",
  verifyHostLoginToken,
  upload.array("images"),
  hostAddProperty
);
router.get("/listings", verifyHostLoginToken, hostGetHostProperties);
router.get(
  "/available-listings",
  verifyHostLoginToken,
  hostGetHostAvailableProperties
);
router.get(
  "/unavailable-listings",
  verifyHostLoginToken,
  hostGetHostUnavailableProperties
);
router.put("/mark-listing-available/:id", hostMarkListingAsAvailable);
router.put("/mark-listing-unavailable/:id", hostMarkListingAsUnavailable);

router.get("/listing/:id", hostFetchSingleProperty);
router.delete("/delete-listing/:id", verifyHostLoginToken, hostDeleteProperty);
router.put(
  "/update-listing/:id",
  verifyHostLoginToken,
  upload.array("images"),
  hostEditProperty
);
router.put(
  "/confirm-booking/:id",
  verifyHostLoginToken,
  hostApproveShortletBooking,
  apartmentAvailableEmail
);
router.put(
  "/decline-booking/:id",
  verifyHostLoginToken,
  hostDeclineShortletBooking
);

router.get(
  "/shortlet-bookings",
  verifyHostLoginToken,
  hostFetchShortletBookings
);
router.get("/single-shortlet-booking/:id", hostFetchSingleShortletBooking);

module.exports = router;
