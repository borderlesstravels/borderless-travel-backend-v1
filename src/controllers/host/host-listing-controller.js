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

    const host = await Host.findById(req.id);
    if (!host) {
      return sendError(
        res,
        "Unauthorised. Host account cannot ben found. Kindly try again."
      );
    }
    const hostPropCount = host.properties;
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
    const { listingFields } = require("../../services/listing-fields");
    const property = new ShortLet({ ...listingFields(req.body), owner: req.id, images, status: "available" });
    await property.save();
    await host.save();
    return sendSuccess(
      res,
      `Successfully added a new listing - ${req.body.apartment_name}`,
      property
    );
  } catch (error) {
    return sendError(res, "Unable to add a new listing");
  }
};

const hostEditProperty = async (req, res) => {
  try {
    const selected = await ShortLet.findOne({ _id: req.params.id, owner: req.id });
    if (!selected) return sendError(res, "Listing not found", 404);
    const { listingFields } = require("../../services/listing-fields");
    const changes = listingFields(req.body);
    const markup = await Markup.findOne({ service_name: "stay" });
    for (const key of ["single_price", "suites_price", "executive_price", "double_chambers_price"]) {
      if (Object.hasOwn(changes, key)) {
        const price = Number(changes[key]);
        if (!Number.isFinite(price) || price < 0) return sendError(res, "Invalid listing price", 400);
        changes[key] = price + price * Number(markup?.commission || 0) / 100;
      }
    }
    let retained = req.body.current_images;
    if (typeof retained === "string") {
      try { retained = JSON.parse(retained); } catch { return sendError(res, "Invalid images", 400); }
    }
    if (retained !== undefined) {
      if (!Array.isArray(retained)) return sendError(res, "Invalid images", 400);
      changes.images = selected.images.filter(image => retained.some(item =>
        typeof item?.url === "string" && item.url === image.url && item.public_id === image.public_id));
    }
    if (req.files?.length) {
      const uploaded = await uploadMultipleImages(req, res, "Apartment images are missing!");
      if (!uploaded) return;
      changes.images = [...(changes.images || selected.images), ...uploaded];
    }
    const property = await ShortLet.findOneAndUpdate({ _id: req.params.id, owner: req.id },
      { $set: changes }, { new: true, runValidators: true });
    if (!property) return sendError(res, "Listing not found", 404);
    return sendSuccess(res, "Successfully updated the listing", property);
  } catch {
    return sendError(res, "Unable to update the listing data", 400);
  }
};
const hostGetHostProperties = async (req, res) => {
  const userId = req.id;
  try {
    const properties = await ShortLet.find({ owner: userId });
    if (!properties.length) {
      return sendSuccess(res, "No listings record yet");
    }
    const hostProperties = properties.filter((item) => item.owner == userId);
    if (!hostProperties.length) {
      return sendSuccess(res, "You have no listings yet");
    }
    return sendSuccess(res, "Successfully fetched data", hostProperties);
  } catch (error) {
    return sendError(res, "Cannot fetch host's listings", 500);
  }
};

const hostGetHostAvailableProperties = async (req, res) => {
  const userId = req.id;
  try {
    const properties = await ShortLet.find({ owner: userId, status: "available" });
    if (!properties.length) {
      return sendSuccess(res, "No listings record yet");
    }
    const hostProperties = properties.filter((item) => item.owner == userId);
    if (!hostProperties.length) {
      return sendSuccess(res, "You have no listings yet");
    }
    return sendSuccess(res, "Successfully fetched data", hostProperties);
  } catch (error) {
    return sendError(res, "Cannot fetch host's listings", 500);
  }
};

const hostGetHostUnavailableProperties = async (req, res) => {
  const userId = req.id;
  try {
    const properties = await ShortLet.find({ owner: userId, status: "unavailable" });
    if (!properties.length) {
      return sendSuccess(res, "No listings record yet");
    }
    const hostProperties = properties.filter((item) => item.owner == userId);
    if (!hostProperties.length) {
      return sendSuccess(res, "You have no listings yet");
    }
    return sendSuccess(res, "Successfully fetched data", hostProperties);
  } catch (error) {
    return sendError(res, "Cannot fetch host's listings", 500);
  }
};

const hostMarkListingAsAvailable = async (req, res, next) => {
  try {
    const listing = await ShortLet.findOne({ _id: req.params.id, owner: req.id });
    if (!listing) {
      return sendError(res, "Listing not found", 404);
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
    const listing = await ShortLet.findOne({ _id: req.params.id, owner: req.id });
    if (!listing) {
      return sendError(res, "Listing not found", 404);
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
    const shortlet = await ShortLet.findOne({ _id: req.params.id, owner: req.id });
    if (!shortlet) {
      return sendError(res, "Listing not found", 404);
    }
    return sendSuccess(
      res,
      "Successfully fetched the requested shortlet apartment",
      shortlet
    );
  } catch (error) {
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
    if (shortletBooking.length > 0) {
      return sendError(
        res,
        "You cannot delete this listing at this time as it has a pending booking that has been paid for. Please contact the support team for help"
      );
    }
    await ShortLet.findByIdAndDelete(req.params.id);
    return sendSuccess(res, "Successfully deleted the listing data");
  } catch (error) {
    return sendError(res, "Unable to delete the listing data");
  }
};

const hostApproveShortletBooking = async (req, res, next) => {
  try {
    const { reviewHostBooking } = require("../../services/review-host-booking");
    const { booking, user } = await reviewHostBooking(req.params.id, req.id, "confirmed");
    req.body = { email: user.email, first_name: user.first_name, apartment_name: booking.apartment_name,
      location: `${booking.apartment_address}, ${booking.apartment_city}, ${booking.apartment_country}`,
      price: booking.price, date: `${dateFormatter(booking.check_in_date)} - ${dateFormatter(booking.check_out_date)}` };
    return next();
  } catch (error) {
    return sendError(res, error.status ? error.message : "Unable to review booking", error.status || 503);
  }
};

const hostDeclineShortletBooking = async (req, res) => {
  try {
    const { reviewHostBooking } = require("../../services/review-host-booking");
    await reviewHostBooking(req.params.id, req.id, "declined");
    return sendSuccess(res, "Successfully declined the reservation");
  } catch (error) {
    return sendError(res, error.status ? error.message : "Unable to review booking", error.status || 503);
  }
};
// fetchShortletBookings
const hostFetchShortletBookings = async (req, res) => {
  const userId = req.id;
  try {
    let bookings = await ShortletBooking.find({ apartment_owner: userId }).select("-api_key -firm");
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
    return sendError(res, "Unable to fetch the requested shortlet apartment");
  }
};

const hostFetchSingleShortletBooking = async (req, res) => {
  try {
    const shortletBooking = await ShortletBooking.findOne({ _id: req.params.id, apartment_owner: req.id }).select("-api_key -firm");
    if (!shortletBooking) {
      return sendError(res, "Booking not found", 404);
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
