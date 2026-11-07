const axios = require("axios");

class PaymentError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const asNumber = (value) => Number(value?.value ?? value);
const minorUnits = (value) => {
  const amount = asNumber(value);
  const minor = Math.round(amount * 100);
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isSafeInteger(minor)) {
    throw new PaymentError("Invalid stored booking amount", 409);
  }
  return minor;
};

function validateTransaction(transaction, booking, reference) {
  if (!transaction || transaction.status !== "success") {
    throw new PaymentError("Payment has not been confirmed", 409);
  }
  if (transaction.reference !== reference) {
    throw new PaymentError("Payment reference does not match", 409);
  }
  if (transaction.amount !== minorUnits(booking.price)) {
    throw new PaymentError("Payment amount does not match the booking", 409);
  }
  if (transaction.currency !== (booking.currency || "NGN")) {
    throw new PaymentError("Payment currency does not match the booking", 409);
  }
  let metadata = transaction.metadata;
  if (typeof metadata === "string") {
    try { metadata = JSON.parse(metadata); } catch { metadata = null; }
  }
  if (metadata?.booking_reference !== booking.booking_reference) {
    throw new PaymentError("Payment is not linked to this booking", 409);
  }
  const email = booking.contact_details?.c_email || booking.email;
  if (!email || transaction.customer?.email?.toLowerCase() !== email.toLowerCase()) {
    throw new PaymentError("Payment customer does not match the booking", 409);
  }
  if (!transaction.paid_at || !Number.isFinite(Date.parse(transaction.paid_at))) {
    throw new PaymentError("Payment confirmation timestamp is missing", 409);
  }
  return transaction;
}

async function verifyPaystack(reference) {
  if (typeof reference !== "string" || !/^[a-zA-Z0-9._=-]{1,200}$/.test(reference)) {
    throw new PaymentError("Invalid payment reference");
  }
  if (!process.env.PAYSTACK_SECRET) {
    throw new PaymentError("Payment verification is unavailable", 503);
  }
  try {
    // Fixed provider origin: credentials must never follow a client-supplied URL.
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` },
        timeout: 15000, maxRedirects: 0 },
    );
    if (response.data?.status !== true) throw new Error("Unverified response");
    return response.data.data;
  } catch {
    throw new PaymentError("Unable to verify payment. Please retry with the same reference.", 502);
  }
}

module.exports = { PaymentError, asNumber, minorUnits, validateTransaction, verifyPaystack };
