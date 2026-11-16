const mongoose = require("mongoose");
const Intent = require("../models/general/CreditIntent");
const Event = require("../models/general/CreditEvent");
const Link = require("../models/general/CreditLink");
const Funding = require("../models/general/CreditFundingReview");
const Fare = require("../models/general/CreditFareReview");
const User = require("../models/user/User");
const gateway = require("../api/fetcher");
const { text, hash, nairaToMinor, applicationStatus } = require("./gotrip");
function failure(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}
async function matchedApplication(intentId) {
  if (!mongoose.isValidObjectId(intentId)) failure(400, "Invalid selection");
  const intent = await Intent.findById(intentId).lean();
  const link = await Link.findOne({ intent: intentId }).lean();
  if (!intent || !link) failure(409, "Match the customer application first");
  const events = await Event.find({ loanReference: link.loanReference }).lean();
  if (applicationStatus(events) !== "approved_awaiting_funding")
    failure(409, "A consistent approved application is required");
  const approval = events.find(
    (item) =>
      item.event === "loan.approved" && item.disposition === "application",
  );
  if (
    !approval ||
    approval.currency !== "NGN" ||
    !approval.loanAmountMinor ||
    BigInt(approval.loanAmountMinor) <= 0n
  )
    failure(409, "Approved NGN amount is missing or invalid");
  return { intent, link, approval };
}
async function recordFunding(input, adminId) {
  const bankReference = text(input.bankReference, 160),
    reason = text(input.reason, 500);
  const receivedAt = new Date(input.receivedAt);
  if (
    !bankReference ||
    !reason ||
    reason.length < 10 ||
    input.bankReceiptChecked !== true ||
    input.currency !== "NGN" ||
    !input.receivedAt ||
    !Number.isFinite(receivedAt.getTime()) ||
    receivedAt.getTime() > Date.now() + 300000
  )
    failure(
      400,
      "Bank reference, NGN amount, receipt date, review reason and bank-check acknowledgment required",
    );
  let amountMinor;
  try {
    amountMinor = nairaToMinor(input.amountNaira);
  } catch {
    failure(400, "Invalid naira amount");
  }
  if (!amountMinor || BigInt(amountMinor) <= 0n)
    failure(400, "A positive received amount is required");
  const { intent, link, approval } = await matchedApplication(input.intentId);
  if (amountMinor !== approval.loanAmountMinor)
    failure(
      409,
      "Received amount differs from the full approved application amount; investigate before proceeding",
    );
  if (
    approval.reportedDisbursedMinor &&
    approval.reportedDisbursedMinor !== amountMinor
  )
    failure(
      409,
      "Reported amount conflicts with received amount; review required",
    );
  const evidence = {
    intent: String(intent._id),
    providerReference:
      approval.providerTransactionReference || link.loanReference,
    bankReference,
    amountMinor,
    currency: "NGN",
    receivedAt: receivedAt.toISOString(),
    reason,
  };
  const evidenceHash = hash(JSON.stringify(evidence));
  try {
    return await Funding.create({
      ...evidence,
      evidenceHash,
      reviewedBy: adminId,
    });
  } catch (error) {
    if (error.code !== 11000) throw error;
    const existing = await Funding.findOne({ intent: intent._id });
    if (existing?.evidenceHash === evidenceHash) return existing;
    failure(
      409,
      "Selection or transaction already reconciled with different evidence",
    );
  }
}
async function recheckFare(intentId, adminId) {
  const { intent } = await matchedApplication(intentId);
  const user = await User.findById(intent.owner).select("status").lean();
  if (!user || String(user.status).toLowerCase() === "blocked")
    failure(409, "Customer account is unavailable");
  const funding = await Funding.findOne({ intent: intent._id }).lean();
  if (!funding)
    failure(
      409,
      "Record the bank funding review before checking fare readiness",
    );
  const failedCheck = async (status, message, outcome = "unavailable") => {
    await Fare.create({
      intent: intent._id,
      reviewedBy: adminId,
      flightId: intent.flightId,
      fundingMinor: funding.amountMinor,
      currency: "NGN",
      outcome,
      expiresAt: new Date(),
    });
    failure(status, message);
  };
  let response;
  try {
    response = await gateway.fetcher_tiqwa(
      `/flight/confirm_price/${encodeURIComponent(intent.flightId)}`,
    );
  } catch {
    return failedCheck(
      503,
      "Fare lookup is unavailable; no booking or ticket was created",
    );
  }
  if (response?.status !== 200)
    return failedCheck(
      503,
      "Fare could not be confirmed. No reservation or ticket was created; search again or retry the read",
    );
  const quote = response.data;
  if (quote?.id !== intent.flightId || quote.currency !== "NGN")
    return failedCheck(
      409,
      "Provider quote does not match this NGN flight selection",
      "invalid_quote",
    );
  let amountMinor;
  try {
    amountMinor = nairaToMinor(quote.amount);
  } catch {
    return failedCheck(
      409,
      "Provider quote amount is invalid",
      "invalid_quote",
    );
  }
  if (!amountMinor || BigInt(amountMinor) <= 0n)
    return failedCheck(
      409,
      "Provider quote amount is invalid",
      "invalid_quote",
    );
  const outcome =
    BigInt(amountMinor) > BigInt(funding.amountMinor)
      ? "shortfall"
      : BigInt(amountMinor) < BigInt(funding.amountMinor)
        ? "surplus"
        : "matched";
  return Fare.create({
    intent: intent._id,
    reviewedBy: adminId,
    flightId: intent.flightId,
    amountMinor,
    fundingMinor: funding.amountMinor,
    currency: "NGN",
    outcome,
    expiresAt: new Date(Date.now() + 300000),
  });
}
module.exports = { recordFunding, recheckFare };
