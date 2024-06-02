const { log } = require('console');
const { fetcher_tiqwa } = require('../../api/fetcher');
const { sender_tiqwa } = require('../../api/sender');
const FlightBooking = require('../../models/general/FlightBooking');
const { sendError } = require('../../utils/helpers');
const User = require('../../models/user/User');

const fetchAirports = async (req, res) => {
  const response = await fetcher_tiqwa('/airports');
  if (!response) {
    return sendError(res, 'Unable to complete this request at this time. Please try again.');
  }
  if (response?.status === 200) {
    return res.status(response.status).json({ success: true, data: response.data });
  } else {
    return sendError(res, response?.data.Message, response?.status);
  }
};

const fetchAirlines = async (req, res) => {
  const response = await fetcher_tiqwa('/airports');
  if (!response) {
    return sendError(res, 'Unable to complete this request at this time. Please try again.');
  }
  if (response?.status === 200) {
    return res.status(response.status).json({ success: true, data: response.data });
  } else {
    return sendError(res, response?.data.Message, response?.status);
  }
};

const flightOfferSearch = async (req, res, next) => {
  const response = await fetcher_tiqwa('/flight/search', req.body);
  if (!response) {
    return sendError(res, 'Unable to complete this request at this time. Please try again.');
  }
  if (response?.status === 200) {
    return res.status(response.status).json({ success: true, data: response.data });
  } else {
    return sendError(res, response?.data.Message, response?.status);
  }
};

const confirmFlightPrice = async (req, res) => {
  const { flight_id } = req.params;
  const response = await fetcher_tiqwa(`/flight/confirm_price/${flight_id}`);
  if (!response) {
    return sendError(res, 'Unable to complete this request at this time.Please try again.');
  }
  if (response?.status === 200) {
    return res.status(response.status).json({ success: true, data: response.data });
  } else {
    return sendError(res, response?.data.Message, response?.status);
  }
};

const bookFlight = async (req, res) => {
  const { flight_id } = req.params;
  const userId = req.id;
  const { contact_details, passenger_details } = req.body;
  const client = passenger_details[0];

  const user = await User.findById(userId, '-password');
  if (!user) return sendError(res, 'Sorry, please login first');
  let userBookings = user.bookings;
  userBookings = userBookings + 1;

  if (user.email !== contact_details.c_email)
    return sendError(res, 'Sorry, kindly use your registered email address for easy circle backs');

  try {
    const response = await sender_tiqwa(`/flight/book/${flight_id}`, {
      passengers: passenger_details,
    });
    if (!response) {
      return sendError(res, 'Unable to complete this request at this time. Please try again.');
    }
    console.log('response', response);
    if (response?.status === 200) {
      const outboundData = response.data.outbound;
      const destPicker = Number(outboundData.length - 1);

      const airline = outboundData[0].airline_details.name;
      const airline_logo = outboundData[0].airline_details.logo;
      const departure_time = outboundData[0].departure_time;
      const arrival_time = outboundData[destPicker].arrival_time;

      const originCode = outboundData[0].airport_from;
      const destinationCode = outboundData[destPicker].airport_to;

      const findAirports = await fetcher_tiqwa('/airports');
      if (!findAirports) {
        return sendError(res, 'Unable to complete this request at this time. Please try again.');
      }
      if (findAirports?.status === 200) {
        const allAirports = findAirports.data;
        const departureAirport = allAirports.filter((airport) => airport.iata_code === originCode);
        const arrivalAirport = allAirports.filter(
          (airport) => airport.iata_code === destinationCode
        );

        console.log('departureAirport', departureAirport);
        console.log('arrivalAirport', arrivalAirport);

        const origin = departureAirport[0].name;
        const destination = arrivalAirport[0].name;

        const contactDetails = new FlightBooking({
          owner: user._id,
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
          origin,
          destination,
          price: response?.data?.amount,
          status: response?.data?.status,
          payment_status: 'pending',
          booking_reference: response?.data.reference,
        });
        await contactDetails.save();
        await User.findByIdAndUpdate(userId, { bookings: userBookings });
        return res.status(response.status).json({ success: true, data: response.data });
      } else {
        return sendError(res, 'Unable to save booking to the database.');
      }
    } else if (response?.status === 400) {
      return sendError(
        res,
        "Please check the traveller's document(s) you provided. It might contain an expired document.",
        response?.status
      );
    } else if (response?.status === 403) {
      return sendError(res, response.data.Message, response?.status);
    } else if (response?.status === 404) {
      return sendError(res, response.data.Message, response?.status);
    } else {
      return sendError(res, response?.statusText, response?.status);
    }
  } catch (error) {
    return sendError(res, `Unable to book your flight at this time. Error - ${error}`);
  }
};

const fetchFlightTicketDetails = async (req, res) => {
  const { booking_reference } = req.params;
  const response = await fetcher_tiqwa(`/flight/${booking_reference}`);
  log('response', response.data);
  if (response?.status === 200) {
    return res.status(response.status).json({ success: true, data: response.data });
  } else {
    return sendError(res, response?.data.message, response?.status);
  }
};

module.exports = {
  fetchAirports,
  fetchAirlines,
  flightOfferSearch,
  confirmFlightPrice,
  bookFlight,
  fetchFlightTicketDetails,
};
