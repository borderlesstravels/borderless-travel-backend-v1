const { PaymentError } = require("./payment-integrity");
const ROOMS = ["single", "suites", "executive", "double_chambers"];
function shortletQuote(apartment, body, now = new Date()) {
  if (apartment.status !== "available") throw new PaymentError("Property is unavailable", 409);
  function date(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new PaymentError("Use a valid booking date", 400);
    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new PaymentError("Use a valid booking date", 400);
    return parsed;
  }
  const check_in_date = date(body.check_in_date), check_out_date = date(body.check_out_date);
  const days = (check_out_date - check_in_date) / 86400000;
  if (days <= 0 || !Number.isSafeInteger(days) || body.check_in_date < now.toISOString().slice(0, 10)) {
    throw new PaymentError("Check-out must follow a current or future check-in date", 400);
  }
  const available = ROOMS.filter(room => Number(apartment[room]) > 0 && Number(apartment[`${room}_price`]) > 0);
  let room;
  if (body.room_type !== undefined) {
    if (!available.includes(body.room_type)) throw new PaymentError("Room type unavailable", 409);
    room = body.room_type;
  } else {
    // Compatibility for the existing client: its quoted nightly price must
    // match a current saved room rate. The client never determines the total.
    room = available.find(name => Number(body.price) === Number(apartment[`${name}_price`]));
    if (!room) throw new PaymentError("Room price has changed. Refresh the property and try again.", 409);
  }
  const nightly = Number(apartment[`${room}_price`]);
  const minor = Math.round(nightly * 100), total = minor * days;
  if (!Number.isFinite(nightly) || Math.abs(nightly * 100 - minor) > 1e-7 ||
      !Number.isSafeInteger(total) || total <= 0) throw new PaymentError("Property pricing requires review", 409);
  return { check_in_date, check_out_date, difference_in_days: days, price: total / 100 };
}
module.exports = { shortletQuote };
