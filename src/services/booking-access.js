const jwt = require("jsonwebtoken");
const FlightBooking = require("../models/general/FlightBooking");
const User = require("../models/user/User");
const { getSessionToken, verifyLoginSession } = require("../middlewares/general");

function issueBookingAccess(booking) {
  if (!process.env.JWT_USER_SECRET_KEY) throw new Error("Booking access signing unavailable");
  if (typeof booking.firm !== "string" || !booking.firm ||
      typeof booking.booking_reference !== "string" || !booking.booking_reference) {
    throw new Error("Booking access requires a firm and reference");
  }
  return jwt.sign({ booking_reference: booking.booking_reference, firm: booking.firm }, process.env.JWT_USER_SECRET_KEY, {
    algorithm: "HS256", audience: "borderless-booking-receipt", expiresIn: "1d",
  });
}

async function canReadBooking(req, booking) {
  const bearer = req.headers.authorization;
  if (typeof bearer === "string" && bearer.startsWith("Bearer ")) {
    try {
      const claims = jwt.verify(bearer.slice(7), process.env.JWT_USER_SECRET_KEY, {
        algorithms: ["HS256"], audience: "borderless-booking-receipt",
      });
      if (typeof claims.firm === "string" && claims.firm &&
          claims.booking_reference === booking.booking_reference && claims.firm === booking.firm) return true;
    } catch { /* An invalid receipt never grants access. */ }
  }
  if (req.headers["u-x-key"]) {
    const session = await getSessionToken(String(req.headers["u-x-key"]));
    const identity = {};
    if (session && await verifyLoginSession(session.value, process.env.JWT_USER_SECRET_KEY, identity) &&
        String(session.owner) === String(identity.id)) {
      const user = await User.findById(identity.id).select("email status");
      if (user && String(user.status).toLowerCase() !== "blocked" && user.email === booking.owner) return true;
    }
  }
  return false;
}

async function findReadableFlight(req, reference) {
  if (typeof reference !== "string" || !reference || reference.length > 200) return null;
  const booking = await FlightBooking.findOne({ booking_reference: reference, firm: req.headers.firm });
  return booking && await canReadBooking(req, booking) ? booking : null;
}

module.exports = { issueBookingAccess, canReadBooking, findReadableFlight };
