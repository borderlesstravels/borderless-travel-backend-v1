const Flight = require("../../models/general/FlightBooking");
const Shortlet = require("../../models/general/ShortletBooking");
const { verifyPaystackSignature } = require("../../services/webhook-signatures");
const { recordPayment } = require("../../services/record-payment");

async function paystackWebhook(req, res) {
  if (!verifyPaystackSignature(req.rawBody, req.headers)) return res.sendStatus(401);
  if (req.body.event !== "charge.success") return res.sendStatus(200);
  let metadata = req.body.data?.metadata;
  if (typeof metadata === "string") {
    try { metadata = JSON.parse(metadata); } catch { return res.sendStatus(400); }
  }
  const reference = metadata?.booking_reference;
  if (typeof reference !== "string" || !reference || reference.length > 200) return res.sendStatus(200);
  try {
    const [flights, shortlets] = await Promise.all([
      Flight.find({ booking_reference: reference }).limit(2),
      Shortlet.find({ booking_reference: reference }).limit(2),
    ]);
    if (!flights.length && !shortlets.length) return res.sendStatus(200);
    if (flights.length + shortlets.length !== 1) return res.sendStatus(409);
    const booking = flights[0] || shortlets[0];
    await recordPayment({ service: flights.length ? "flight" : "shortlet",
      firm: booking.firm, bookingReference: reference,
      transactionReference: req.body.data.reference,
      user: shortlets.length ? { email: booking.owner } : null });
    // Await durable recording before acknowledging; Vercel may freeze after response.
    return res.sendStatus(200);
  } catch (error) {
    console.error("Paystack webhook recording failed", { code: error.code || "PAYMENT_FAILED" });
    return res.sendStatus(error.status === 409 ? 409 : 503);
  }
}
module.exports = { paystackWebhook };
