const mongoose = require("mongoose");
const Booking = require("../models/general/ShortletBooking");
const User = require("../models/user/User");
const Notification = require("../models/general/Notification");
const { PaymentError } = require("./payment-integrity");

async function reviewHostBooking(id, owner, status) {
  if (!["confirmed", "declined"].includes(status)) throw new PaymentError("Invalid booking decision", 400);
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const booking = await Booking.findOne({ _id: id, apartment_owner: owner }).session(session);
      if (!booking) throw new PaymentError("Booking not found", 404);
      if (booking.status !== "pending" || booking.payment_status !== "pending") throw new PaymentError("Booking has already been reviewed or paid", 409);
      const user = await User.findOne({ email: booking.owner }).select("email first_name").session(session);
      if (!user) throw new PaymentError("Booking owner requires reconciliation", 409);
      booking.status = status;
      await booking.save({ session });
      await Notification.create([{ owner: String(user._id), type: "booking", title: `Reservation ${status}`,
        description: status === "confirmed" ? "Your reservation has been confirmed. Open your booking to review payment details."
          : "Your reservation was declined. Please select another property or contact support.",
      }], { session });
      result = { booking, user };
    });
    return result;
  } finally { await session.endSession(); }
}
module.exports = { reviewHostBooking };
