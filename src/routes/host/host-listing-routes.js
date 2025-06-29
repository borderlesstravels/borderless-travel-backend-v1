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
} = require("../../controllers/host/host-listing-controller");

const router = express.Router();

// Shortlet
router.post(
  "/add-listing",
  verifyHostLoginToken,
  upload.array("images"),
  hostAddProperty
);
router.get("/listings", verifyHostLoginToken, hostGetHostProperties);
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
  hostApproveShortletBooking
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
