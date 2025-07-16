const Review = require("../../models/general/Review");
const ShortletBooking = require("../../models/general/ShortletBooking");
const Host = require("../../models/host/Host");
const ShortLet = require("../../models/host/ShortLet");
const User = require("../../models/user/User");
const {
  sendError,
  sendSuccess,
  saveNotification,
  generateString,
  verifyAPIToken,
} = require("../../utils/helpers");

const fetchShortlets = async (req, res) => {
  const { firm, api_key } = req.headers;
  await verifyAPIToken(res, firm, api_key);
  try {
    const shortlets = await ShortLet.find({ status: "available" }).limit(
      req.query.limit
    );
    if (!shortlets.length) {
      return sendSuccess(res, "No shortlet apartments record yet");
    }
    return sendSuccess(
      res,
      "Successfully fetched the available shortlet apartments",
      shortlets
    );
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to fetch available shortlets");
  }
};

const fetchShortletsMinified = async (req, res) => {
  const { firm, api_key } = req.headers;
  await verifyAPIToken(res, firm, api_key);
  try {
    const stlt = await ShortLet.find({ status: "available" });
    const shortlets = stlt.map((ele) => ({
      _id: ele._id,
      apartment_name: ele.apartment_name,
      country: ele.country,
      state: ele.state,
      lga: ele.lga,
      address: ele.address,
    }));

    if (!shortlets.length) {
      return sendSuccess(res, "No shortlet apartments record yet");
    }
    return sendSuccess(
      res,
      "Successfully fetched the available shortlet apartments",
      shortlets
    );
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to fetch available shortlets");
  }
};

const fetchSingleShortlet = async (req, res) => {
  const { firm, api_key } = req.headers;
  await verifyAPIToken(res, firm, api_key);
  try {
    const shortlet = await ShortLet.findById(req.params.id);
    // console.log("shortlet", shortlet);
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

const fetchShortletReviews = async (req, res) => {
  try {
    const reviews = await Review.find();
    if (!reviews.length) {
      return sendSuccess(res, "No reviews record yet");
    }
    const shortletReviews = reviews.filter(
      (item) => item.product_reviewed == req.params.product_reviewed
    );
    if (!shortletReviews.length) {
      return sendSuccess(res, "This shortlet apartment has no reviews yet");
    }
    return sendSuccess(
      res,
      "Successfully fetched the shortlet reviews",
      shortletReviews
    );
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to fetch available shortlets");
  }
};

const bookStayAUth = async (req, res, next) => {
  const { apartment_id } = req.params;
  const { firm, api_key } = req.headers;
  const userId = req.id;

  const user = await User.findById(userId, "-password");
  if (!user) return sendError(res, "Sorry, please login first");
  let userBookings = user.bookings;
  userBookings = userBookings + 1;

  const apartment = await ShortLet.findById(apartment_id);
  if (!apartment) sendError(res, "Apartment does not or no longer exists");

  const token = generateString(15);
  const booking_reference = `BT-${token}`;

  const host = await Host.findById(apartment.owner);
  if (!host) sendError(res, "Apartment does not belong to anyone");
  const hostGuestsCount = host.guests;

  let check_in_date = new Date(req.body.check_in_date);
  let check_out_date = new Date(req.body.check_out_date);
  let difference_in_time = check_out_date.getTime() - check_in_date.getTime();
  let difference_in_days = Math.round(difference_in_time / (1000 * 3600 * 24));
  let price = Number(req.body.price) * Number(difference_in_days);

  try {
    const newBooking = new ShortletBooking({
      owner: userId,
      firm,
      api_key,
      apartment_id,
      apartment_name: apartment.apartment_name,
      apartment_address: apartment.address,
      apartment_city: apartment.lga,
      apartment_state: apartment.state,
      apartment_country: apartment.country,
      apartment_img: apartment.images.split(", ")[0].toString(),
      apartment_owner: apartment.owner,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      phone: user.phone ? user.phone : "",
      check_in_date,
      check_out_date,
      check_in_time: req.body.check_in_time ? req.body.check_in_time : "",
      gps_location: req.body.gps_location ? req.body.gps_location : "",
      price,
      booking_reference,
    });
    host.guests = Number(hostGuestsCount + 1);
    await newBooking.save();
    await host.save();
    const notifyUser = await saveNotification(
      userId,
      "booking",
      `Your reservation for ${apartment.apartment_name} has been created`,
      `Your reservation for a shortlet apartment; ${apartment.apartment_name} in ${apartment.address}, ${apartment.lga} has been successfully created. Get ready to pay soon`,
      user
    );
    const booking_id = newBooking._id;
    if (notifyUser) {
      const notifyHost = await saveNotification(
        apartment.owner,
        "booking",
        `Someone requested reservation for ${apartment.apartment_name}`,
        `Your apartment, ${apartment.apartment_name} located in ${apartment.address}, ${apartment.lga} has been requested for reservation. <a href="${process.env.USER_APP_URL}/login?redirect=/stay-reservation/${booking_id}">Take action action here</a>`,
        host,
        apartment_id,
        booking_id
      );
      if (notifyHost) {
        req.body -
          {
            newBooking,
            host,
            user,
          };
        return sendSuccess(
          res,
          "Successfully created your shortlet booking. Please wait for feedback",
          newBooking
        );
      }
    }
  } catch (error) {
    console.log(error);
    return sendError(
      res,
      "Unable to complete your booking. Something went wrong"
    );
  }
};

const bookStayThirdParty = async (req, res, next) => {
  const { firm, api_key } = req.headers;
  await verifyAPIToken(res, firm, api_key);

  const { apartment_id } = req.params;

  const apartment = await ShortLet.findById(apartment_id);
  if (!apartment) sendError(res, "Apartment does not or no longer exists");

  const token = generateString(15);
  const booking_reference = `TP-${token}`;

  const host = await Host.findById(apartment.owner);
  if (!host) sendError(res, "Apartment does not belong to anyone");

  let check_in_date = new Date(req.body.check_in_date);
  let check_out_date = new Date(req.body.check_out_date);
  let difference_in_time = check_out_date.getTime() - check_in_date.getTime();
  let difference_in_days = Math.round(difference_in_time / (1000 * 3600 * 24));
  let price = Number(req.body.price) * Number(difference_in_days);

  try {
    const newBooking = new ShortletBooking({
      owner: api_key,
      firm: firm,
      api_key: api_key,
      apartment_id,
      apartment_name: apartment.apartment_name,
      apartment_address: apartment.address,
      apartment_city: apartment.lga,
      apartment_state: apartment.state,
      apartment_country: apartment.country,
      apartment_img: apartment.images.split(", ")[0].toString(),
      apartment_owner: apartment.owner,
      name: `${req.body.first_name} ${req.body.last_name}`,
      email: req.body.email,
      phone: req.body.phone ? req.body.phone : "",
      check_in_date,
      check_out_date,
      check_in_time: req.body.check_in_time ? req.body.check_in_time : "",
      gps_location: req.body.gps_location ? req.body.gps_location : "",
      price,
      booking_reference,
    });
    await newBooking.save();
    const booking_id = newBooking._id;
    if (booking_id) {
      const notifyHost = await saveNotification(
        apartment.owner,
        "booking",
        `Someone requested reservation for ${apartment.apartment_name}`,
        `Your apartment, ${apartment.apartment_name} located in ${apartment.address}, ${apartment.lga} has been requested for reservation. <a href="${process.env.USER_APP_URL}/stay-booking-detail/${booking_id}">Take action action here</a>`,
        host,
        apartment_id,
        booking_id
      );
      if (notifyHost) {
        return sendSuccess(
          res,
          "Successfully created your shortlet booking. Please wait for feedback",
          newBooking
        );
      }
    }
  } catch (error) {
    console.log(error);
    return sendError(
      res,
      "Unable to complete your booking. Something went wrong"
    );
  }
};

const fetchShortletsForLet = async (req, res) => {
  const { firm, api_key } = req.headers;
  await verifyAPIToken(res, firm, api_key);
  let shuffledShortlets;
  try {
    const shortlets = await ShortLet.find().limit(req.query.limit);
    if (shortlets) {
      const newArr = shortlets.slice();
      for (let i = newArr.length - 1; i > 0; i--) {
        const rand = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[rand]] = [newArr[rand], newArr[i]];
      }
      shuffledShortlets = newArr.slice(0, 4);
    }
    return sendSuccess(
      res,
      "Successfully fetched the available shortlet apartments",
      shuffledShortlets
    );
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to fetch available shortlets");
  }
};

module.exports = {
  fetchShortlets,
  fetchShortletsMinified,
  fetchSingleShortlet,
  fetchShortletReviews,

  bookStayAUth,
  bookStayThirdParty,

  fetchShortletsForLet,
};
