const Host = require("../../models/host/Host");
const ShortLet = require("../../models/host/ShortLet");
const {
  sendError,
  sendSuccess,
  saveNotification,
  dateFormatter,
} = require("../../utils/helpers");
const ShortletBooking = require("../../models/general/ShortletBooking");
const User = require("../../models/user/User");
const Markup = require("../../models/app-core/Markup");
const { uploadMultipleImages } = require("../../middlewares/general");
const Notification = require("../../models/general/Notification");

const hostAddProperty = async (req, res) => {
  // let commission_amount = 0;

  try {
    const images = await uploadMultipleImages(
      req,
      res,
      "Apartment images are missing!"
    );

    if (!images) {
      return sendError(res, "Apartment images are missing!");
    }

    req.body.images = images;
    req.body.owner = req.id;
    console.log("req body", req.body);
    console.log("images", images);

    const host = await Host.findById(req.id);
    if (!host) {
      return sendError(
        res,
        "Unauthorised. Host account cannot ben found. Kindly try again."
      );
    }
    hostPropCount = host.properties;
    host.properties = Number(hostPropCount + 1);
    const markup = await Markup.findOne({ service_name: "stay" });
    if (markup) {
      const commission_percent = markup.commission;

      if (Number(req.body.single_price) > 0) {
        const price = req.body.single_price;
        const commission_amount =
          (Number(commission_percent) / 100) * Number(price);
        req.body.single_price = Number(price) + Number(commission_amount);
      }
      if (Number(req.body.suites_price) > 0) {
        const price = req.body.suites_price;
        const commission_amount =
          (Number(commission_percent) / 100) * Number(price);
        req.body.suites_price = Number(price) + Number(commission_amount);
      }
      if (Number(req.body.executive_price) > 0) {
        const price = req.body.executive_price;
        const commission_amount =
          (Number(commission_percent) / 100) * Number(price);
        req.body.executive_price = Number(price) + Number(commission_amount);
      }
    }
    const property = new ShortLet(req.body);
    await property.save();
    await host.save();
    console.log("property", property);
    return sendSuccess(
      res,
      `Successfully added a new listing - ${req.body.apartment_name}`,
      property
    );
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to add a new listing");
  }
};

const hostEditProperty = async (req, res) => {
  // let new_images = [];
  let current_images = req.body.current_images;
  if (req.files?.length) {
    let new_images = await uploadMultipleImages(
      req,
      res,
      "Apartment images are missing!"
    );
    console.log("new_images", new_images);
    if (new_images) {
      let images = current_images.concat(new_images);
      req.body.images = images;
    } else {
      req.body.images = req.body.images;
    }
  }
  console.log("req body", req.body);
  let commission_amount = 0;

  try {
    const selectedProperty = await ShortLet.findById(req.params.id);
    console.log("selectedProperty", selectedProperty);
    if (selectedProperty.owner != req.id) {
      return sendError(
        res,
        "You are not authenticated to modify this property"
      );
    }

    const markup = await Markup.findOne({ service_name: "stay" });
    if (markup) {
      const commission_percent = markup.commission;

      if (Number(req.body.single_price) > 0) {
        const price = req.body.single_price;
        const commission_amount =
          (Number(commission_percent) / 100) * Number(price);
        req.body.single_price = Number(price) + Number(commission_amount);
      }
      if (Number(req.body.suites_price) > 0) {
        const price = req.body.suites_price;
        const commission_amount =
          (Number(commission_percent) / 100) * Number(price);
        req.body.suites_price = Number(price) + Number(commission_amount);
      }
      if (Number(req.body.executive_price) > 0) {
        const price = req.body.executive_price;
        const commission_amount =
          (Number(commission_percent) / 100) * Number(price);
        req.body.executive_price = Number(price) + Number(commission_amount);
      }
    }

    const property = await ShortLet.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    return sendSuccess(
      res,
      `Successfully updated the listing - ${req.body.apartment_name}`,
      property
    );
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to update the listing data");
  }
};

const hostGetHostProperties = async (req, res) => {
  const userId = req.id;
  try {
    const properties = await ShortLet.find();
    if (!properties.length) {
      return sendSuccess(res, "No listings record yet");
    }
    const hostProperties = properties.filter((item) => item.owner == userId);
    if (!hostProperties.length) {
      return sendSuccess(res, "You have no listings yet");
    }
    return sendSuccess(res, "Successfully fetched data", hostProperties);
  } catch (error) {
    console.log("error", error);
    return sendError(res, "Cannot fetch host's listings", 500);
  }
};

const hostGetHostAvailableProperties = async (req, res) => {
  const userId = req.id;
  try {
    const properties = await ShortLet.find({ status: "available" });
    if (!properties.length) {
      return sendSuccess(res, "No listings record yet");
    }
    const hostProperties = properties.filter((item) => item.owner == userId);
    if (!hostProperties.length) {
      return sendSuccess(res, "You have no listings yet");
    }
    return sendSuccess(res, "Successfully fetched data", hostProperties);
  } catch (error) {
    console.log("error", error);
    return sendError(res, "Cannot fetch host's listings", 500);
  }
};

const hostGetHostUnavailableProperties = async (req, res) => {
  const userId = req.id;
  try {
    const properties = await ShortLet.find({ status: "unavailable" });
    if (!properties.length) {
      return sendSuccess(res, "No listings record yet");
    }
    const hostProperties = properties.filter((item) => item.owner == userId);
    if (!hostProperties.length) {
      return sendSuccess(res, "You have no listings yet");
    }
    return sendSuccess(res, "Successfully fetched data", hostProperties);
  } catch (error) {
    console.log("error", error);
    return sendError(res, "Cannot fetch host's listings", 500);
  }
};

const hostMarkListingAsAvailable = async (req, res, next) => {
  try {
    const listing = await ShortLet.findById(req.params.id);
    if (!listing) {
      return sendError(res, "Could not verify property existence");
    }
    listing.status = "available";
    await listing.save();
    return sendSuccess(
      res,
      "Successfully marked listing as AVAILABLE",
      listing
    );
  } catch (error) {
    return sendError(res, "Cannot update your password");
  }
};
const hostMarkListingAsUnavailable = async (req, res, next) => {
  try {
    const listing = await ShortLet.findById(req.params.id);
    if (!listing) {
      return sendError(res, "Could not verify property existence");
    }
    listing.status = "unavailable";
    await listing.save();
    return sendSuccess(
      res,
      "Successfully marked listing as UNAVAILABLE",
      listing
    );
  } catch (error) {
    return sendError(res, "Cannot update your password");
  }
};

const hostFetchSingleProperty = async (req, res) => {
  try {
    const shortlet = await ShortLet.findById(req.params.id);
    if (!shortlet) {
      return sendSuccess(
        res,
        "No such shortlet apartment exists or no longer exists"
      );
    }
    return sendSuccess(
      res,
      "Successfully fetched the requested shortlet apartment",
      shortlet
    );
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to fetch the requested shortlet apartment");
  }
};

const hostDeleteProperty = async (req, res) => {
  try {
    const property = await ShortLet.findOne({
      _id: req.params.id,
      owner: req.id,
    });
    if (!property) {
      return sendError(res, "Listing is no longer available");
    }
    const shortletBooking = await ShortletBooking.find({
      apartment_id: property._id,
      status: "pending",
      payment_status: "paid",
    });
    console.log("shortletBooking", shortletBooking);
    if (shortletBooking.length > 0) {
      return sendError(
        res,
        "You cannot delete this listing at this time as it has a pending booking that has been paid for. Please contact the support team for help"
      );
    }
    await ShortLet.findByIdAndDelete(req.params.id);
    return sendSuccess(res, "Successfully deleted the listing data");
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to delete the listing data");
  }
};

const hostApproveShortletBooking = async (req, res, next) => {
  try {
    const apartmentBooking = await ShortletBooking.findOne({
      _id: req.params.id,
    });
    console.log({ apartmentBooking });

    if (!apartmentBooking) {
      return sendError(res, "Such apartment post cannot be found!");
    }

    if (apartmentBooking.apartment_owner !== req.id) {
      return sendError(res, "Apartment is not owned by you!");
    }
    if (apartmentBooking.status === "confirmed") {
      return sendError(
        res,
        "Apartment's availability had already been confirmed!"
      );
    }

    apartmentBooking.status = "confirmed";

    const user = await User.findOne({ email: apartmentBooking.owner });
    if (!user) {
      return sendError(res, "Sorry, booking request owner not found");
    }

    const newNot = new Notification({
      owner: apartmentBooking.owner,
      type: "booking",
      title: `Reservation for ${apartmentBooking.apartment_name} confirmed`,
      description: `Your reservation for a shortlet apartment; ${apartmentBooking.apartment_name} in ${apartmentBooking.address}, ${apartmentBooking.lga} has been successfully confirmed. Property is verified to be available. Please <a href="${process.env.USER_APP_URL}/stay-booking/${apartmentBooking.booking_reference}"> proceed to make payment</a>`,
    });

    await apartmentBooking.save();
    await newNot.save();
    const check_in_date = dateFormatter(apartmentBooking.check_in_date);
    const check_out_date = dateFormatter(apartmentBooking.check_out_date);

    req.body = {
      email: user.email,
      first_name: user.first_name,
      apartment_name: apartmentBooking.apartment_name,
      location: `${apartmentBooking.apartment_address}, ${apartmentBooking.apartment_city}, ${apartmentBooking.apartment_country}`,
      price: apartmentBooking.price,
      date: `${check_in_date} - ${check_out_date}`,
    };
    next();
  } catch (error) {
    console.log(error);
    return sendError(
      res,
      "Unable to complete your request. Something went wrong"
    );
  }
};

const hostDeclineShortletBooking = async (req, res, next) => {
  try {
    const apartmentBooking = await ShortletBooking.findOne({
      _id: req.params.id,
    });
    if (apartmentBooking.apartment_owner !== req.id)
      return sendError(res, "Apartment is not owned by you!");
    if (apartmentBooking.status === "declined") {
      return sendError(
        res,
        "Apartment's unavailability had already been confirmed!"
      );
    }
    if (apartmentBooking.status === "confirmed") {
      return sendError(
        res,
        "Apartment already confirmed to be available. Contact support for action."
      );
    }
    if (!apartmentBooking) {
      return sendError(res, "Such apartment post cannot be found!");
    }

    apartmentBooking.status = "declined";

    const user = await User.findOne({ email: apartmentBooking.owner });
    if (!user) {
      return sendError(res, "Sorry, booking request owner not found");
    }

    await apartmentBooking.save();

    await saveNotification(
      apartmentBooking.owner,
      "booking",
      `Apartment ${apartmentBooking.apartment_name} is unavailable`,
      `Your reservation for a shortlet apartment; ${apartmentBooking.apartment_name} in ${apartmentBooking.address}, ${apartmentBooking.lga} cannot continue due to unavailability. Please check for another apartment. Thank you for your understanding.`,
      user
    );
    return sendSuccess(
      res,
      "Successfully verified apartment's unavailability"
    );
  } catch (error) {
    console.log(error);
    return sendError(
      res,
      "Unable to complete your request. Something went wrong"
    );
  }
};

// fetchShortletBookings
const hostFetchShortletBookings = async (req, res) => {
  const userId = req.id;
  try {
    let bookings = await ShortletBooking.find();
    bookings = bookings.filter((book) => book.apartment_owner == userId);

    const pendingBookings = bookings.filter(
      (book) => book.status === "pending"
    );
    const declinedBookings = bookings.filter(
      (book) => book.status === "declined"
    );
    const confirmedBookings = bookings.filter(
      (book) => book.status === "confirmed"
    );
    const completedBookings = bookings.filter((book) => book.status === "paid");
    return sendSuccess(
      res,
      "Successfully fetched the requested shortlet apartment",
      {
        bookings,
        pendingBookings,
        declinedBookings,
        confirmedBookings,
        completedBookings,
      }
    );
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to fetch the requested shortlet apartment");
  }
};

const hostFetchSingleShortletBooking = async (req, res) => {
  try {
    const shortletBooking = await ShortletBooking.findById(req.params.id);
    if (!shortletBooking) {
      return sendSuccess(res, "No shortlet booking record found");
    }
    return sendSuccess(res, "Successfully fetched booking", shortletBooking);
  } catch (error) {
    return sendError(res, "Cannot fetch shortlet booking");
  }
};

module.exports = {
  hostAddProperty,
  hostEditProperty,
  hostGetHostProperties,
  hostGetHostAvailableProperties,
  hostGetHostUnavailableProperties,
  hostMarkListingAsAvailable,
  hostMarkListingAsUnavailable,

  hostFetchSingleProperty,
  hostDeleteProperty,

  hostApproveShortletBooking,
  hostDeclineShortletBooking,

  hostFetchShortletBookings,
  hostFetchSingleShortletBooking,
};
