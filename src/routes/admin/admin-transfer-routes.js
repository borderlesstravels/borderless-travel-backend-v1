const express = require("express");
const upload = require("../../../multer");

const {
  validateAddVehicleParams,
  validate,
} = require("../../middlewares/validator");
const {
  addVehicle,
  updateVehicleData,
  deleteVehicleData,
  singleVehicleDetails,
  allVehicles,
  addTransferLocation,
  updateLocationData,
  allLocations,
  deleteLocationData,
  transferBookings,
  vehicleBookings,
} = require("../../controllers/admin/admin-transfer-controller");
const router = express.Router();

router.post("/add-vehicle", upload.array("vehicle_image"), addVehicle);
router.put(
  "/edit-vehicle/:id",
  upload.array("vehicle_image"),
  updateVehicleData
);
router.delete("/delete-vehicle/:id", deleteVehicleData);
router.get("/all-vehicles", allVehicles);
router.get("/vehicle-details/:id", singleVehicleDetails);

router.post("/add-location", addTransferLocation);
router.put("/edit-location/:id", updateLocationData);
router.delete("/delete-location/:id", deleteLocationData);
router.get("/fetch-locations", allLocations);

router.get("/transfer-bookings", transferBookings);
router.get("/transfer-bookings/:vehicle_id", vehicleBookings);

module.exports = router;
