const bcrypt = require("bcryptjs");
const { log } = require("console");
const { fetcher_tiqwa } = require("../../api/fetcher");
const { sender_tiqwa } = require("../../api/sender");
const FlightBooking = require("../../models/general/FlightBooking");
const { sendError, verifyAPIToken } = require("../../utils/helpers");
const User = require("../../models/user/User");
const APIToken = require("../../models/app-core/APIToken");

const fetchAirports = async (req, res) => {
  const { firm, api_key } = req.headers;
  await verifyAPIToken(firm, api_key);

  const response = await fetcher_tiqwa("/airports");
  if (!response) {
    return sendError(
      res,
      "Unable to complete this request at this time. Please try again."
    );
  }
  if (response?.status === 200) {
    return res
      .status(response.status)
      .json({ success: true, data: response.data });
  } else {
    return sendError(res, response?.data.Message, response?.status);
  }
};

const fetchAirlines = async (req, res) => {
  const { firm, api_key } = req.headers;
  await verifyAPIToken(firm, api_key);

  console.log({ firm });
  console.log({ api_key });
  const response = await fetcher_tiqwa("/airports");
  if (!response) {
    return sendError(
      res,
      "Unable to complete this request at this time. Please try again."
    );
  }
  if (response?.status === 200) {
    return res
      .status(response.status)
      .json({ success: true, data: response.data });
  } else {
    return sendError(res, response?.data.Message, response?.status);
  }
};

const flightOfferSearch = async (req, res, next) => {
  const { firm, api_key } = req.headers;
  await verifyAPIToken(firm, api_key);

  console.log({ firm });
  console.log({ api_key });
  const response = await fetcher_tiqwa("/flight/search", req.body);
  if (!response) {
    return sendError(
      res,
      "Unable to complete this request at this time. Please try again."
    );
  }
  if (response?.status === 200) {
    return res
      .status(response.status)
      .json({ success: true, data: response.data });
  } else {
    return sendError(res, response?.data.Message, response?.status);
  }
};

const flightOfferSearchMultiCity = async (req, res, next) => {
  const { firm, api_key } = req.headers;
  await verifyAPIToken(firm, api_key);
  console.log("req.body", req.body.destinations[0]);

  const response = await sender_tiqwa(`/flight/multi_city/search`, req.body);
  if (!response) {
    return sendError(
      res,
      "Unable to complete this request at this time. Please try again."
    );
  }
  console.log({ response });

  if (response?.status === 200) {
    return res
      .status(response.status)
      .json({ success: true, data: response.data });
  } else {
    return sendError(res, response?.data.Message, response?.status);
  }
};

const confirmFlightPrice = async (req, res) => {
  const { firm, api_key } = req.headers;
  await verifyAPIToken(firm, api_key);

  const { flight_id } = req.params;
  const response = await fetcher_tiqwa(`/flight/confirm_price/${flight_id}`);
  if (!response) {
    return sendError(
      res,
      "Unable to complete this request at this time.Please try again."
    );
  }
  if (response?.status === 200) {
    return res
      .status(response.status)
      .json({ success: true, data: response.data });
  } else {
    return sendError(res, response?.data.Message, response?.status);
  }
};

const bookFlightAuth = async (req, res) => {
  const { firm, api_key } = req.headers;
  await verifyAPIToken(firm, api_key);

  const { flight_id } = req.params;
  const userId = req.id;
  const { contact_details, passenger_details } = req.body;
  const client = passenger_details[0];

  const user = await User.findById(userId, "-password");
  if (!user) return sendError(res, "Sorry, please login first");
  let userBookings = user.bookings;
  userBookings = userBookings + 1;

  if (user.email !== contact_details.c_email)
    return sendError(
      res,
      "Sorry, kindly use your registered email address for easy circle backs"
    );

  try {
    const response = await sender_tiqwa(`/flight/book/${flight_id}`, {
      passengers: passenger_details,
    });
    if (!response) {
      return sendError(
        res,
        "Unable to complete this request at this time. Please try again."
      );
    }
    console.log("response", response);
    if (response?.status === 200) {
      const outboundData = response.data.outbound;
      const destPicker = Number(outboundData.length - 1);

      const airline = outboundData[0].airline_details.name;
      const airline_logo = outboundData[0].airline_details.logo;
      const departure_time = outboundData[0].departure_time;
      const arrival_time = outboundData[destPicker].arrival_time;

      const origin_code = outboundData[0].airport_from;
      const destination_code = outboundData[destPicker].airport_to;

      const findAirports = await fetcher_tiqwa("/airports");
      if (!findAirports) {
        return sendError(
          res,
          "Unable to complete this request at this time. Please try again."
        );
      }
      if (findAirports?.status === 200) {
        const allAirports = findAirports.data;
        const departureAirport = allAirports.filter(
          (airport) => airport.iata_code === origin_code
        );
        const arrivalAirport = allAirports.filter(
          (airport) => airport.iata_code === destination_code
        );

        console.log("departureAirport", departureAirport);
        console.log("arrivalAirport", arrivalAirport);

        const origin = departureAirport[0].city;
        const destination = arrivalAirport[0].city;

        const contactDetails = new FlightBooking({
          owner: user._id,
          firm: firm,
          api_key: api_key,
          flight_id: flight_id,
          client_name: `${client.first_name} ${client.last_name}`,
          client_phone: client.phone_number,
          client_email: client.email,
          contact_name: `${contact_details.c_first_name} ${contact_details.c_last_name}`,
          contact_email: contact_details.c_email,
          contact_phone: contact_details.c_phone_number,
          contact_relationship: contact_details.c_relationship_to_p,
          airline,
          airline_logo,
          departure_time,
          arrival_time,
          origin_code,
          destination_code,
          origin,
          destination,
          price: response?.data?.amount,
          status: response?.data?.status,
          payment_status: "pending",
          booking_reference: response?.data.reference,
        });
        await contactDetails.save();
        await User.findByIdAndUpdate(userId, { bookings: userBookings });
        return res
          .status(response.status)
          .json({ success: true, data: response.data });
      } else {
        return sendError(res, "Unable to save booking to the database.");
      }
      // } else if (response?.status === 400) {
      //   console.log(response);
      //   return sendError(
      //     res,
      //     "Please check the traveller's document(s) you provided. It might contain an expired document.",
      //     response?.status
      //   );
      // } else if (response?.status === 403) {
      //   return sendError(res, response.data.Message, response?.status);
      // } else if (response?.status === 404) {
      //   return sendError(res, response.data.message, response?.status);
    } else {
      console.log({ response: response.data });
      return sendError(res, response?.statusText, response?.status);
    }
  } catch (error) {
    return sendError(
      res,
      `Unable to book your flight at this time. Error - ${error}`
    );
  }
};

const bookFlightNoAuth = async (req, res) => {
  const { firm, api_key } = req.headers;
  await verifyAPIToken(firm, api_key);

  const { flight_id } = req.params;
  const { contact_details, passenger_details } = req.body;
  const client = passenger_details[0];
  const password = contact_details.c_first_name.toLowerCase();
  const hashedPassword = bcrypt.hashSync(password);

  try {
    existingUser = await User.findOne({ email: contact_details.c_email });
  } catch (err) {
    console.log(err);
    return sendError(
      res,
      "Unable to verify that you do not have an account yet."
    );
  }
  if (existingUser) {
    return sendError(
      res,
      "You are already a registered user. Please login first to continue, or use another email adrress"
    );
  }

  const user = new User({
    first_name: contact_details.c_first_name,
    last_name: contact_details.c_last_name,
    email: contact_details.c_email,
    password: hashedPassword,
    bookings: 1,
  });

  try {
    const response = await sender_tiqwa(`/flight/book/${flight_id}`, {
      passengers: passenger_details,
    });
    if (!response) {
      return sendError(
        res,
        "Unable to complete this request at this time. Please try again."
      );
    }
    console.log("response", response);
    if (response?.status === 200) {
      const outboundData = response.data.outbound;
      const destPicker = Number(outboundData.length - 1);

      const airline = outboundData[0].airline_details.name;
      const airline_logo = outboundData[0].airline_details.logo;
      const departure_time = outboundData[0].departure_time;
      const arrival_time = outboundData[destPicker].arrival_time;

      const origin_code = outboundData[0].airport_from;
      const destination_code = outboundData[destPicker].airport_to;

      const findAirports = await fetcher_tiqwa("/airports");
      if (!findAirports) {
        return sendError(
          res,
          "Unable to complete this request at this time. Please try again."
        );
      }
      if (findAirports?.status === 200) {
        const allAirports = findAirports.data;
        const departureAirport = allAirports.filter(
          (airport) => airport.iata_code === origin_code
        );
        const arrivalAirport = allAirports.filter(
          (airport) => airport.iata_code === destination_code
        );

        const origin = departureAirport[0].city;
        const destination = arrivalAirport[0].city;

        try {
          const savedUser = await user.save();
          const contactDetails = new FlightBooking({
            owner: savedUser._id,
            firm: firm,
            api_key: api_key,
            flight_id: flight_id,
            client_name: `${client.first_name} ${client.last_name}`,
            client_phone: client.phone_number,
            client_email: client.email,
            contact_name: `${contact_details.c_first_name} ${contact_details.c_last_name}`,
            contact_email: contact_details.c_email,
            contact_phone: contact_details.c_phone_number,
            contact_relationship: contact_details.c_relationship_to_p,
            airline,
            airline_logo,
            departure_time,
            arrival_time,
            origin_code,
            destination_code,
            origin,
            destination,
            price: response?.data?.amount,
            status: response?.data?.status,
            payment_status: "pending",
            booking_reference: response?.data.reference,
          });
          await contactDetails.save();
          return res
            .status(response.status)
            .json({ success: true, data: response.data });
        } catch (error) {
          return sendError(
            res,
            "Ticket booked, but we are unable to save your data on our database. Kindly get in touch with us soon."
          );
        }
      } else {
        return sendError(res, "Unable to save booking to the database.");
      }
      // } else if (response?.status === 400) {
      //   console.log("response", response);
      //   return sendError(
      //     res,
      //     "Please check the traveller's document(s) you provided. It might contain an expired document.",
      //     response?.status
      //   );
      // } else if (response?.status === 403) {
      //   return sendError(res, response.data.Message, response?.status);
      // } else if (response?.status === 404) {
      //   return sendError(res, response.data.message, response?.status);
    } else {
      return sendError(res, response?.statusText, response?.status);
    }
  } catch (error) {
    return sendError(
      res,
      `Unable to book your flight at this time. Error - ${error}`
    );
  }
};

const bookFlightBorderless = async (req, res) => {
  const { firm, api_key } = req.headers;
  await verifyAPIToken(firm, api_key);

  const { flight_id } = req.params;
  const { contact_details, passenger_details } = req.body;
  const client = passenger_details[0];
  const password = contact_details.c_first_name.toLowerCase();
  const hashedPassword = bcrypt.hashSync(password);

  const user = new User({
    first_name: contact_details.c_first_name,
    last_name: contact_details.c_last_name,
    email: contact_details.c_email,
    password: hashedPassword,
    bookings: 1,
  });

  try {
    const response = await sender_tiqwa(`/flight/book/${flight_id}`, {
      passengers: passenger_details,
    });
    if (!response) {
      return sendError(
        res,
        "Unable to complete this request at this time. Please try again."
      );
    }
    console.log("response", response);
    if (response?.status === 200) {
      const outboundData = response.data.outbound;
      const destPicker = Number(outboundData.length - 1);

      const airline = outboundData[0].airline_details.name;
      const airline_logo = outboundData[0].airline_details.logo;
      const departure_time = outboundData[0].departure_time;
      const arrival_time = outboundData[destPicker].arrival_time;

      const origin_code = outboundData[0].airport_from;
      const destination_code = outboundData[destPicker].airport_to;

      const findAirports = await fetcher_tiqwa("/airports");
      if (!findAirports) {
        return sendError(
          res,
          "Unable to complete this request at this time. Please try again."
        );
      }
      if (findAirports?.status === 200) {
        const allAirports = findAirports.data;
        const departureAirport = allAirports.filter(
          (airport) => airport.iata_code === origin_code
        );
        const arrivalAirport = allAirports.filter(
          (airport) => airport.iata_code === destination_code
        );

        const origin = departureAirport[0].city;
        const destination = arrivalAirport[0].city;

        try {
          // const savedUser = await user.save();
          const contactDetails = new FlightBooking({
            firm: firm,
            api_key: api_key,
            // owner: savedUser._id,
            flight_id: flight_id,
            client_name: `${client.first_name} ${client.last_name}`,
            client_phone: client.phone_number,
            client_email: client.email,
            contact_name: `${contact_details.c_first_name} ${contact_details.c_last_name}`,
            contact_email: contact_details.c_email,
            contact_phone: contact_details.c_phone_number,
            contact_relationship: contact_details.c_relationship_to_p,
            airline,
            airline_logo,
            departure_time,
            arrival_time,
            origin_code,
            destination_code,
            origin,
            destination,
            price: response?.data?.amount,
            status: response?.data?.status,
            payment_status: "pending",
            booking_reference: response?.data.reference,
          });
          await contactDetails.save();
          return res
            .status(response.status)
            .json({ success: true, data: response.data });
        } catch (error) {
          return sendError(
            res,
            "Ticket booked, but we are unable to save your data on our database. Kindly get in touch with us soon."
          );
        }
      } else {
        return sendError(res, "Unable to save booking to the database.");
      }
    } else {
      return sendError(res, response?.statusText, response?.status);
    }
  } catch (error) {
    return sendError(
      res,
      `Unable to book your flight at this time. Error - ${error}`
    );
  }
};

const fetchFlightTicketDetails = async (req, res) => {
  const { firm, api_key } = req.headers;
  await verifyAPIToken(firm, api_key);

  const { booking_reference } = req.params;
  const response = await fetcher_tiqwa(`/flight/${booking_reference}`);
  log("response", response.data);
  if (response?.status === 200) {
    return res
      .status(response.status)
      .json({ success: true, data: response.data });
  } else {
    return sendError(res, response?.data.message, response?.status);
  }
};

module.exports = {
  fetchAirports,
  fetchAirlines,
  flightOfferSearch,
  flightOfferSearchMultiCity,
  confirmFlightPrice,
  bookFlightAuth,
  bookFlightNoAuth,
  bookFlightBorderless,
  fetchFlightTicketDetails,
};
