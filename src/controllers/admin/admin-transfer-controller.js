const { uploadSingleImage } = require("../../middlewares/general");
const TransferBooking = require("../../models/general/TransferBooking");
const TransferLocation = require("../../models/general/TransferLocation");
const TransferVehicle = require("../../models/general/TransferVehicle");
const { sendSuccess, sendError } = require("../../utils/helpers");

const addVehicle = async (req, res) => {
  req.body.action_by = req.id;
  const { vehicle_name, vehicle_provider, model, location, vehicle_terms } =
    req.body;
  const vehicle_image = await uploadSingleImage(req, res);
  if (!vehicle_image) {
    return sendError(res, "Please add a photo of the vehicle");
  }
  try {
    const existingVehicle = await TransferVehicle.findOne({
      vehicle_name,
      vehicle_provider,
      model,
      location,
      vehicle_terms,
    });
    if (existingVehicle) {
      return sendError(res, "You have already added this vehicle detail.");
    }
    req.body.vehicle_image = vehicle_image;
    req.body.vehicle_terms = vehicle_terms?.split(". ");
    const newDAta = new TransferVehicle(req.body);
    await newDAta.save();
    return sendSuccess(res, "Successfully added a new vehicle", newDAta);
  } catch (error) {
    console.log("error", error);
    return sendError(res, `Could not add a new vehicle data. Error - ${error}`);
  }
};

const updateVehicleData = async (req, res) => {
  req.body.action_by = req.id;
  try {
    const vehicle = await TransferVehicle.findById(req.params.id);
    if (req.files.length) {
      const vehicle_image = await uploadSingleImage(
        req,
        res,
        "Please add a cover thumbnail image for this vehicle"
      );
      req.body.vehicle_image = vehicle_image;
    } else {
      if (vehicle) {
        req.body.vehicle_image = vehicle.vehicle_image;
      }
    }

    if (req.body.vehicle_terms) {
      req.body.vehicle_terms = req.body.vehicle_terms?.split(". ");
    }
    const updatedData = await TransferVehicle.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    return sendSuccess(
      res,
      "Vehicle data has been successfully updated",
      updatedData
    );
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to update vehicle data");
  }
};

const deleteVehicleData = async (req, res) => {
  try {
    await TransferVehicle.findByIdAndDelete(req.params.id);
    return sendSuccess(res, "Successfully deleted the vehicle data");
  } catch (err) {
    console.log("content delete error", err);
    return sendError(res, "Unable to delete the vehicle data");
  }
};

const allVehicles = async (req, res) => {
  try {
    const data = await TransferVehicle.find().limit(req.query.limit);
    return sendSuccess(res, "Successfully fetched all data", data);
  } catch (error) {
    return sendError(res, "Cannot fetch vehicles data");
  }
};

const singleVehicleDetails = async (req, res) => {
  try {
    const data = await TransferVehicle.findById(req.params.id);
    return sendSuccess(res, "Successfully fetched the data", data);
  } catch (error) {
    return sendError(res, "Cannot fetch vehicles data");
  }
};

// LOCATION
const addTransferLocation = async (req, res) => {
  req.body.action_by = req.id;
  const { city, city_code, airport_name, airport_code, country } = req.body;
  try {
    const dataExists = await TransferLocation.findOne({
      city,
      city_code,
      airport_name,
      airport_code,
      country,
    });
    if (dataExists) {
      return sendError(res, "You have already added this city data.");
    }
    const newDAta = new TransferLocation(req.body);
    await newDAta.save();
    return sendSuccess(res, "Successfully added a new city data", newDAta);
  } catch (error) {
    console.log("error", error);
    return sendError(res, `Could not add a new city data. Error - ${error}`);
  }
};

const updateLocationData = async (req, res) => {
  req.body.action_by = req.id;
  try {
    const data = await TransferLocation.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    return sendSuccess(
      res,
      "Location data has been successfully updated",
      data
    );
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to update vehicle data");
  }
};

const deleteLocationData = async (req, res) => {
  try {
    await TransferLocation.findByIdAndDelete(req.params.id);
    return sendSuccess(res, "Successfully deleted the location data");
  } catch (err) {
    console.log("content delete error", err);
    return sendError(res, "Unable to delete the location data");
  }
};

const allLocations = async (req, res) => {
  try {
    const data = await TransferLocation.find().limit(req.query.limit);
    return sendSuccess(res, "Successfully fetched all data", data);
  } catch (error) {
    return sendError(res, "Cannot fetch data");
  }
};

// BOOKINGS
const vehicleBookings = async (req, res) => {
  try {
    const data = await TransferBooking.find({
      vehicle_id: req.params.vehicle_id,
    });
    return sendSuccess(res, "Successfully fetched the data", data);
  } catch (error) {
    return sendError(res, "Cannot fetch vehicles data");
  }
};

module.exports = {
  addVehicle,
  updateVehicleData,
  deleteVehicleData,
  allVehicles,
  singleVehicleDetails,

  addTransferLocation,
  updateLocationData,
  deleteLocationData,
  allLocations,

  vehicleBookings,
};
