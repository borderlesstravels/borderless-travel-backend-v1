const crypto = require("node:crypto");
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
function verifySignature(
  raw,
  header,
  secret,
  now = Math.floor(Date.now() / 1000),
) {
  if (!secret || !Buffer.isBuffer(raw) || typeof header !== "string")
    return false;
  const parts = header.split(",").map((part) => part.trim().split("="));
  if (parts.length !== 2 || parts.some((pair) => pair.length !== 2))
    return false;
  const timestamps = parts.filter(([key]) => key === "t");
  const signatures = parts.filter(([key]) => key === "v1");
  if (timestamps.length !== 1 || signatures.length !== 1) return false;
  const timestamp = timestamps[0][1],
    signature = signatures[0][1];
  if (!/^\d{1,12}$/.test(timestamp) || !/^[a-fA-F0-9]{64}$/.test(signature))
    return false;
  if (
    !Number.isSafeInteger(Number(timestamp)) ||
    Math.abs(now - Number(timestamp)) > 300
  )
    return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(timestamp + ".")
    .update(raw)
    .digest();
  return crypto.timingSafeEqual(expected, Buffer.from(signature, "hex"));
}
const text = (value, max = 160) =>
  typeof value === "string" && value.trim().length > 0 && value.length <= max
    ? value.trim()
    : null;
// Partner confirms all supplied numeric amounts are naira. Store exact minor
// units as strings, without using any amount as proof of completed funding.
function nairaToMinor(value) {
  if (value === undefined || value === null) return null;
  if (!["number", "string"].includes(typeof value))
    throw new Error("INVALID_AMOUNT");
  const raw = String(value);
  if (!/^\d{1,14}(?:\.\d{1,2})?$/.test(raw)) throw new Error("INVALID_AMOUNT");
  const [whole, fraction = ""] = raw.split(".");
  const minor = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  if (minor > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error("INVALID_AMOUNT");
  return minor.toString();
}
function parseEvent(body, key) {
  const event = text(body?.event, 80);
  const loanReference = text(
    typeof body?.reference === "number" && Number.isSafeInteger(body.reference)
      ? String(body.reference)
      : body?.reference,
  );
  const occurredAt = new Date(body?.occurred_at);
  if (
    !event ||
    !loanReference ||
    !event.startsWith("loan.") ||
    !text(key, 512) ||
    key !== `${loanReference}:${event}` ||
    !body?.occurred_at ||
    !Number.isFinite(occurredAt.getTime())
  )
    throw new Error("INVALID_EVENT");
  // Keep unknown/disbursement/repayment events for review; none can trigger funding.
  let disposition = ["loan.created", "loan.approved", "loan.declined"].includes(
    event,
  )
    ? "application"
    : "review_required";
  const customerEmail = text(
    body?.data?.customer?.email || body?.data?.user?.email,
    254,
  )?.toLowerCase();
  const loan = body?.data?.loan || body?.data || {};
  const currency = text(loan.currency, 3)?.toUpperCase();
  const providerStatus = text(loan.status, 40)?.toLowerCase();
  const nestedReference = text(loan.reference);
  let reviewReason = null,
    loanAmountMinor = null,
    reportedDisbursedMinor = null;
  if (disposition === "application") {
    const statuses = {
      "loan.created": ["pending", "created"],
      "loan.approved": ["approved"],
      "loan.declined": ["declined", "rejected"],
    };
    if (currency && currency !== "NGN") reviewReason = "unsupported_currency";
    if (providerStatus && !statuses[event].includes(providerStatus))
      reviewReason = "contradictory_status";
    if (nestedReference && nestedReference !== loanReference)
      reviewReason = "contradictory_reference";
    try {
      if (currency === "NGN") {
        loanAmountMinor = nairaToMinor(loan.loan_amount);
        reportedDisbursedMinor = nairaToMinor(loan.amount_disbursed);
      }
    } catch {
      reviewReason = "invalid_amount";
    }
    if (reviewReason) disposition = "review_required";
  }
  return {
    event,
    loanReference,
    providerTransactionReference: loanReference,
    occurredAt,
    customerEmail,
    disposition,
    currency,
    providerStatus,
    loanAmountMinor,
    reportedDisbursedMinor,
    reviewReason,
    keyHash: hash(key),
  };
}
function applicationStatus(events) {
  if (events.some((item) => item.reviewReason)) return "review_required";
  const decisions = new Set(
    events
      .filter((item) => item.disposition === "application")
      .map((item) => item.event),
  );
  // Arrival order is not a source of truth. Conflicting decisions need staff review.
  if (decisions.has("loan.approved") && decisions.has("loan.declined"))
    return "review_required";
  if (decisions.has("loan.declined")) return "declined";
  if (decisions.has("loan.approved")) return "approved_awaiting_funding";
  return decisions.has("loan.created")
    ? "application_received"
    : "awaiting_application";
}
module.exports = {
  hash,
  verifySignature,
  parseEvent,
  applicationStatus,
  text,
  nairaToMinor,
};
