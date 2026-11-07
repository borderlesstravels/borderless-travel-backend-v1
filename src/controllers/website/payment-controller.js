const { verifyAPIToken, sendSuccess, dateFormatter, formatCurrency } = require("../../utils/helpers");
const User = require("../../models/user/User");
const { recordPayment } = require("../../services/record-payment");

const paymentHandler = (service) => async (req, res, next) => {
  try {
    const { firm, api_key } = req.headers;
    if (!(await verifyAPIToken(res, firm, api_key))) return;
    const { booking_reference, transaction_reference, service_name } = req.body;
    if (service_name !== service || typeof booking_reference !== "string" ||
        !booking_reference || booking_reference.length > 200) {
      return res.status(400).json({ success: false, error: "Invalid booking payment request" });
    }
    const user = service === "shortlet" ? await User.findById(req.id).select("email") : null;
    const { booking, replay } = await recordPayment({
      service, firm, bookingReference: booking_reference,
      transactionReference: transaction_reference, user,
    });
    res.set("Cache-Control", "private, no-store");
    if (replay) {
      return sendSuccess(res, "Payment already recorded", { booking_reference });
    }
    const contact = booking.contact_details;
    req.body = service === "flight" ? {
      first_name: contact.c_first_name, email: contact.c_email,
      amountPaid: formatCurrency(booking.price), booking_reference,
      date: dateFormatter(booking.created_at),
      route: `${booking.origin} - ${booking.destination}`,
      flight: booking.airline, booking_id: booking._id,
    } : {
      first_name: booking.name.split(" ")[0], email: booking.email,
      apartment_name: booking.apartment_name, amountPaid: formatCurrency(booking.price),
      booking_reference, location: `${booking.apartment_address}, ${booking.apartment_city}, ${booking.apartment_country}`,
      check_in_date: dateFormatter(booking.check_in_date),
      check_out_date: dateFormatter(booking.check_out_date), booking_id: booking._id,
    };
    return next();
  } catch (error) {
    // Do not log provider responses, card/customer data or application secrets.
    console.error("Payment recording failed", { code: error.code || "PAYMENT_FAILED" });
    return res.status(error.status || 503).json({ success: false,
      error: error.status ? error.message : "Payment could not be recorded. Retry with the same reference or contact support." });
  }
};

module.exports = { payForFlight: paymentHandler("flight"), payForShortlet: paymentHandler("shortlet") };
