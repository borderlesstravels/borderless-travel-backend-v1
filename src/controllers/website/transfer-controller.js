const TransferBooking = require("../../models/general/TransferBooking");
const TransferLocation = require("../../models/general/TransferLocation");
const TransferVehicle = require("../../models/general/TransferVehicle");
const {
  sendSuccess,
  sendError,
  generateString,
  verifyAPIToken,
} = require("../../utils/helpers");

const fetchAllLocations = async (req, res) => {
  try {
    const data = await TransferLocation.find().limit(req.query.limit);
    return sendSuccess(res, "Successfully fetched all data", data);
  } catch (error) {
    return sendError(res, "Cannot fetch data");
  }
};

const allTransferVehicles = async (req, res) => {
  try {
    const data = await TransferVehicle.find().limit(req.query.limit);
    return sendSuccess(res, "Successfully fetched all data", data);
  } catch (error) {
    return sendError(res, "Cannot fetch vehicles data");
  }
};

const singleTransferVehicleDetails = async (req, res) => {
  try {
    const data = await TransferVehicle.findById(req.params.id);
    return sendSuccess(res, "Successfully fetched the data", data);
  } catch (error) {
    return sendError(res, "Cannot fetch vehicles data");
  }
};

const fetchVehiclesByLocation = async (req, res) => {
  try {
    const data = await TransferVehicle.find({
      location: req.params.city,
    }).limit(req.query.limit);
    return sendSuccess(res, "Successfully fetched all data", data);
  } catch (error) {
    return sendError(res, "Cannot fetch vehicles data");
  }
};

const bookTransfer = async (req, res, next) => {
  const { firm, api_key } = req.headers;
  if (!(await verifyAPIToken(res, firm, api_key))) return;
  const {
    contact_details,
    passenger_details,
    origin,
    destination,
    date,
    time,
  } = req.body;
  const token = generateString(15);
  const booking_reference = `BT-${token}`;
  const vehicle_id = req.params.vehicle_id;
  try {
    const dataExists = await TransferBooking.findOne({
      owner: contact_details.c_email,
      origin,
      destination,
      date,
      time,
    });
    if (dataExists) {
      return sendError(res, "Duplicate data. Booking data already exists.");
    }

    const vehicle = await TransferVehicle.findById(vehicle_id);
    if (!vehicle) {
      return sendError(
        res,
        "Invalid vehicle ID passed. Vehicle does not exist"
      );
    }
    const newDAta = new TransferBooking({
      owner: contact_details.c_email,
      firm: firm,
      api_key: api_key,
      booking_reference,
      vehicle_id,
      contact_details,
      passenger_details,
      contact_relationship: contact_details.c_relationship_to_p,
      origin,
      destination,
      date,
      time,
    });
    await newDAta.save();
    req.body = {
      first_name: contact_details.c_first_name,
      email: contact_details.c_email,
      category: "Airport Transfers",
      booking_reference,
      date,
      time,
      subject: `Your Booking Is Confirmed`,
      responseMessage:
        "Successfully created your airport transfer booking. Please wait for feedback",
      newDAta,
    };
    next();
  } catch (error) {
    console.log("error", error);
    return sendError(res, `Could not add a new city data. Error - ${error}`);
  }
};

const userBookingByRefrence = async (req, res) => {
  try {
    const data = await TransferBooking.findOne({
      booking_reference: req.params.booking_reference,
    });
    return sendSuccess(res, "Successfully fetched the data", data);
  } catch (error) {
    return sendError(res, "Cannot fetch vehicles data");
  }
};

const userAirportTransferBookings = async (req, res) => {
  try {
    const data = await TransferBooking.find({ owner: req.params.email });
    return sendSuccess(res, "Successfully fetched the data", data);
  } catch (error) {
    return sendError(res, "Cannot fetch vehicles data");
  }
};

module.exports = {
  allTransferVehicles,
  singleTransferVehicleDetails,
  fetchAllLocations,
  fetchVehiclesByLocation,
  bookTransfer,
  userAirportTransferBookings,
  userBookingByRefrence,
};
