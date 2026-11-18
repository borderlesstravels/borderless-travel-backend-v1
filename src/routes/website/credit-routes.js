const express = require("express");
const mongoose = require("mongoose");
const Intent = require("../../models/general/CreditIntent");
const Event = require("../../models/general/CreditEvent");
const { captureRawPayload, shouldCapture } = require("../../services/credit-payload-capture");
const Link = require("../../models/general/CreditLink");
const User = require("../../models/user/User");
const Allocation = require("../../models/general/CreditAllocation");
const Reservation = require("../../models/general/CreditReservation");
const ReviewNote = require("../../models/general/CreditReviewNote");
const {
  allocateCredit,
  reserveCreditBooking,
} = require("../../services/allocate-credit");
const {
  validateFlightBooking,
  validate,
} = require("../../middlewares/validator");
const { verifyAPIToken } = require("../../utils/helpers");
const Funding = require("../../models/general/CreditFundingReview");
const Fare = require("../../models/general/CreditFareReview");
const {
  recordFunding,
  recheckFare,
} = require("../../services/credit-reconciliation");
const { withDeadline } = require("../../services/request-deadline");
const {
  verifyUserLoginToken,
} = require("../../controllers/website/user-auth-controller");
const {
  verifyAdminLoginToken,
} = require("../../controllers/admin/admin-auth-controller");
const {
  hash,
  verifySignature,
  parseEvent,
  applicationStatus,
  text,
} = require("../../services/gotrip");
const router = express.Router();
const enabled = (req, res, next) =>
  process.env.GOTRIP_ENABLED === "true"
    ? next()
    : res.status(503).json({
        error: "Travel on Credit is being prepared. Please contact our team.",
      });
router.use(enabled);
const activeCustomer = async (req, res, next) => {
  const user = await User.findById(req.id).select("status").lean();
  if (!user || String(user.status).toLowerCase() === "blocked") {
    return res.status(403).json({ error: "Customer account is unavailable" });
  }
  return next();
};
router.post("/webhook", async (req, res) => {
  if (!process.env.GOTRIP_WEBHOOK_SECRET) {
    console.warn("GoTrip webhook rejected", { reason: "secret_not_configured" });
    return res.status(503).json({ error: "Webhook not configured" });
  }
  if (
    !verifySignature(
      req.rawBody,
      req.headers["x-lendsqr-signature"],
      process.env.GOTRIP_WEBHOOK_SECRET,
    )
  ) {
    console.warn("GoTrip webhook rejected", { reason: "signature_invalid" });
    return res.sendStatus(401);
  }
  let parsed;
  try {
    parsed = parseEvent(req.body, req.headers["x-idempotency-key"]);
  } catch {
    console.warn("GoTrip webhook rejected", { reason: "invalid_event_envelope" });
    return res.status(400).json({ error: "Invalid event envelope" });
  }
  const payloadHash = hash(req.rawBody);
  const captureEnabled = shouldCapture(parsed);
  if (captureEnabled) {
    try {
      await withDeadline(captureRawPayload({ parsed, rawBody: req.rawBody }), 2500);
    } catch {
      console.error("GoTrip webhook capture failed", { reason: "capture_write_failed" });
      return res.status(503).json({ error: "Unable to securely capture event; retry delivery" });
    }
  }
  try {
    await withDeadline(Event.create({ ...parsed, payloadHash }), 2500);
    console.info("GoTrip webhook accepted", {
      event: parsed.event,
      duplicate: false,
    });
    return res.status(202).json({ received: true });
  } catch (error) {
    if (error.code !== 11000) {
      console.error("GoTrip webhook persistence failed", {
        reason: "event_write_failed",
        code: Number.isInteger(error.code) ? error.code : undefined,
      });
      return res
        .status(503)
        .json({ error: "Unable to persist event; retry delivery" });
    }
    let previous;
    try {
      previous = await withDeadline(
        Event.findOne({ keyHash: parsed.keyHash }).lean(),
        750,
      );
    } catch {
      console.error("GoTrip webhook persistence failed", {
        reason: "duplicate_lookup_failed",
      });
      return res
        .status(503)
        .json({ error: "Receipt lookup unavailable; retry delivery" });
    }
    if (previous?.payloadHash !== payloadHash) {
      console.error("GoTrip webhook rejected", {
        reason: "idempotency_conflict",
      });
      return res
        .status(409)
        .json({ error: "Idempotency conflict; manual review required" });
    }
    console.info("GoTrip webhook accepted", {
      event: parsed.event,
      duplicate: true,
    });
    return res.status(200).json({ received: true, duplicate: true });
  }
});
router.post(
  "/intents",
  verifyUserLoginToken,
  activeCustomer,
  async (req, res) => {
    const requestKey = text(req.headers["x-idempotency-key"], 100);
    const flightId = text(req.body?.flightId, 200);
    if (!requestKey || !flightId)
      return res.status(400).json({ error: "Flight and request key required" });
    const context = {
      flightId,
      origin: text(req.body.origin, 80),
      destination: text(req.body.destination, 80),
      departure: text(req.body.departure, 80),
    };
    const contextHash = hash(JSON.stringify(context));
    let intent;
    try {
      intent = await Intent.create({
        owner: req.id,
        requestKey,
        contextHash,
        ...context,
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      intent = await Intent.findOne({ owner: req.id, requestKey });
      if (!intent || intent.contextHash !== contextHash)
        return res
          .status(409)
          .json({ error: "Request key already used for a different flight" });
    }
    return res.status(201).json({
      success: true,
      data: { id: intent.id, status: "context_saved" },
    });
  },
);
router.get(
  "/intents",
  verifyUserLoginToken,
  activeCustomer,
  async (req, res) => {
    const flightId =
      req.query.flightId === undefined
        ? undefined
        : text(req.query.flightId, 200);
    if (req.query.flightId !== undefined && !flightId)
      return res.status(400).json({ error: "Invalid flight filter" });
    const intents = await Intent.find({
      owner: req.id,
      ...(flightId ? { flightId } : {}),
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const links = await Link.find({
      intent: { $in: intents.map((item) => item._id) },
    }).lean();
    const events = await Event.find({
      loanReference: { $in: links.map((item) => item.loanReference) },
    }).lean();
    const fundingReviews = await Funding.find({
      intent: { $in: intents.map((item) => item._id) },
    }).lean();
    const allocations = await Allocation.find({
      intent: { $in: intents.map((item) => item._id) },
    }).lean();
    const reservations = await Reservation.find({
      _id: { $in: intents.map((item) => String(item._id)) },
    }).lean();
    const linkedBookings = await require("../../models/general/FlightBooking")
      .find({ _id: { $in: allocations.map((item) => item.booking) } })
      .select("status booking_reference")
      .lean();
    const fares = await Fare.find({
      intent: { $in: intents.map((item) => item._id) },
    })
      .sort({ createdAt: -1, _id: -1 })
      .lean();
    return res.json({
      success: true,
      data: intents.map((item) => {
        const link = links.find(
          (candidate) => String(candidate.intent) === String(item._id),
        );
        const history = link
          ? events
              .filter((event) => event.loanReference === link.loanReference)
              .sort(
                (a, b) =>
                  new Date(a.occurredAt) - new Date(b.occurredAt) ||
                  String(a._id).localeCompare(String(b._id)),
              )
          : [];
        const funding = fundingReviews.find(
          (review) => String(review.intent) === String(item._id),
        );
        const allocation = allocations.find(
          (value) => String(value.intent) === String(item._id),
        );
        const reserved = reservations.find(
          (value) => value._id === String(item._id),
        );
        const linkedBooking = allocation
          ? linkedBookings.find(
              (value) => String(value._id) === String(allocation.booking),
            )
          : null;
        const fare = fares.find(
          (review) => String(review.intent) === String(item._id),
        );
        const application = link
          ? applicationStatus(history)
          : "awaiting_manual_match";
        const cancelled = ["cancelled", "canceled"].includes(
          linkedBooking?.status,
        );
        return {
          id: item._id,
          flightId: item.flightId,
          origin: item.origin,
          destination: item.destination,
          createdAt: item.createdAt,
          status:
            application === "review_required"
              ? application
              : allocation
                ? linkedBooking?.status === "issued"
                  ? "ticket_issued"
                  : cancelled
                    ? "booking_cancelled"
                    : "allocated_to_booking"
                : funding && application === "approved_awaiting_funding"
                  ? "funding_review_recorded"
                  : application,
          fundingStatus: funding ? "bank_review_recorded" : "not_verified",
          fundingReviewedAt: funding?.createdAt || null,
          fareReviewStatus: fare
            ? ["unavailable", "invalid_quote"].includes(fare.outcome)
              ? fare.outcome
              : new Date(fare.expiresAt) > new Date()
                ? fare.outcome
                : "expired"
            : "not_checked",
          accountingEnabled: process.env.GOTRIP_ACCOUNTING_ENABLED === "true",
          allocationStatus: allocation ? "allocated" : "unallocated",
          bookingReference:
            allocation?.bookingReference || reserved?.bookingReference || null,
          ticketingEnabled: process.env.GOTRIP_TICKETING_ENABLED === "true",
          ticketStatus:
            linkedBooking?.status === "issued"
              ? "issued"
              : cancelled
                ? "cancelled"
                : "not_issued",
          loanReference: link?.loanReference || null,
          history: history.map((event) => ({
            event: event.event,
            occurredAt: event.occurredAt,
            receivedAt: event.createdAt,
            needsReview: event.disposition === "review_required",
          })),
        };
      }),
    });
  },
);
// One existing admin role. No customer can enumerate events or establish a match.
router.get("/review", verifyAdminLoginToken, async (req, res) => {
  const cursor =
    req.query.cursor === undefined ? undefined : text(req.query.cursor, 24);
  if (
    req.query.cursor !== undefined &&
    (!cursor || !mongoose.isValidObjectId(cursor))
  )
    return res.status(400).json({ error: "Invalid review cursor" });
  const loanReference =
    req.query.loanReference === undefined
      ? undefined
      : text(req.query.loanReference);
  if (req.query.loanReference !== undefined && !loanReference)
    return res.status(400).json({ error: "Invalid loan filter" });
  const events = await Event.find(loanReference ? { loanReference } : {})
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  const searchedLink = loanReference
    ? await Link.findOne({ loanReference }).lean()
    : null;
  const window = await Intent.find(
    searchedLink
      ? { _id: searchedLink.intent }
      : cursor
        ? { _id: { $lt: new mongoose.Types.ObjectId(cursor) } }
        : {},
  )
    .sort({ _id: -1 })
    .limit(101)
    .select("-requestKey -contextHash")
    .lean();
  const intents = window.slice(0, 100);
  const links = await Link.find({
    intent: { $in: intents.map((item) => item._id) },
  }).lean();
  // Include linked application history even when it predates the recent event window.
  const linkedEvents = links.length
    ? await Event.find({
        loanReference: { $in: links.map((item) => item.loanReference) },
      })
        .sort({ createdAt: -1 })
        .limit(500)
        .lean()
    : [];
  const reviewEvents = [
    ...new Map(
      [...events, ...linkedEvents].map((item) => [String(item._id), item]),
    ).values(),
  ];
  const owners = await User.find({
    _id: { $in: intents.map((item) => item.owner) },
  })
    .select("first_name last_name email")
    .lean();
  const customers = intents.map((intent) => ({
    ...intent,
    customer:
      owners.find((owner) => String(owner._id) === String(intent.owner)) ||
      null,
  }));
  const fundingReviews = await Funding.find({
    intent: { $in: intents.map((item) => item._id) },
  }).lean();
  const fareReviews = await Fare.find({
    intent: { $in: intents.map((item) => item._id) },
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  const allocations = await Allocation.find({
    intent: { $in: intents.map((item) => item._id) },
  }).lean();
  const reservations = await Reservation.find({
    _id: { $in: intents.map((item) => String(item._id)) },
  }).lean();
  const notes = await ReviewNote.find({
    intent: { $in: intents.map((item) => item._id) },
  })
    .sort({ createdAt: -1 })
    .limit(300)
    .lean();
  return res.json({
    success: true,
    data: {
      events: reviewEvents,
      intents: customers,
      links,
      fundingReviews,
      fareReviews,
      allocations,
      reservations,
      notes,
      page: {
        hasMore: !searchedLink && window.length > 100,
        nextCursor:
          !searchedLink && window.length > 100
            ? String(intents.at(-1)._id)
            : null,
      },
      config: {
        accountingEnabled: process.env.GOTRIP_ACCOUNTING_ENABLED === "true",
        ticketingEnabled: process.env.GOTRIP_TICKETING_ENABLED === "true",
        localReview: false,
      },
    },
  });
});
router.post("/review/link", verifyAdminLoginToken, async (req, res) => {
  const { intentId, loanReference, reason } = req.body || {};
  if (
    !mongoose.isValidObjectId(intentId) ||
    !text(loanReference) ||
    !text(reason, 500) ||
    reason.trim().length < 10
  )
    return res
      .status(400)
      .json({ error: "Intent, loan reference and review reason required" });
  if (
    !(await Intent.exists({ _id: intentId })) ||
    !(await Event.exists({ loanReference }))
  )
    return res.status(404).json({ error: "Intent or loan not found" });
  try {
    await Link.create({
      intent: intentId,
      loanReference,
      reason: reason.trim(),
      reviewedBy: req.id,
    });
    return res.status(201).json({
      success: true,
      message:
        "Identity match recorded. Funding and ticket issuance remain unverified.",
    });
  } catch (error) {
    if (error.code === 11000)
      return res.status(409).json({
        error: "This intent or loan already has an immutable review link",
      });
    throw error;
  }
});
router.post("/review/notes", verifyAdminLoginToken, async (req, res) => {
  const { intentId, category, reason } = req.body || {};
  if (
    !mongoose.isValidObjectId(intentId) ||
    ![
      "customer_contact",
      "fare_increase",
      "surplus",
      "unavailable",
      "manual_review",
    ].includes(category) ||
    !text(reason, 500) ||
    reason.trim().length < 10
  )
    return res
      .status(400)
      .json({ error: "Selection, note category and review reason required" });
  if (!(await Intent.exists({ _id: intentId })))
    return res.status(404).json({ error: "Selection not found" });
  const note = await ReviewNote.create({
    intent: intentId,
    category,
    reason: reason.trim(),
    actionBy: req.id,
  });
  return res
    .status(201)
    .json({
      success: true,
      data: { id: note.id },
      message: "Review note saved. No funds, booking or ticket were changed.",
    });
});
router.post(
  "/intents/:id/book",
  verifyUserLoginToken,
  activeCustomer,
  validateFlightBooking,
  validate,
  async (req, res) => {
    const { firm, api_key } = req.headers;
    if (!(await verifyAPIToken(res, firm, api_key))) return;
    try {
      const result = await reserveCreditBooking({
        intentId: req.params.id,
        userId: req.id,
        firm,
        apiKey: api_key,
        body: req.body,
      });
      return res.json({
        success: true,
        data: {
          bookingReference: result.booking.booking_reference,
          paymentStatus: result.booking.payment_status,
          ticketStatus: result.booking.status,
          replay: result.replay,
        },
      });
    } catch (error) {
      if (error.status)
        return res.status(error.status).json({
          error: error.message,
          bookingReference: error.bookingReference || null,
        });
      throw error;
    }
  },
);
router.post(
  "/intents/:id/allocate",
  verifyUserLoginToken,
  activeCustomer,
  async (req, res) => {
    try {
      const result = await allocateCredit({
        intentId: req.params.id,
        userId: req.id,
        firm: req.headers.firm,
        bookingReference: req.body?.bookingReference,
      });
      return res.json({
        success: true,
        data: {
          bookingReference: result.booking.booking_reference,
          paymentStatus: result.booking.payment_status,
          replay: result.replay,
        },
      });
    } catch (error) {
      if (error.status)
        return res.status(error.status).json({ error: error.message });
      throw error;
    }
  },
);
router.post("/review/funding", verifyAdminLoginToken, async (req, res) => {
  try {
    const review = await recordFunding(req.body || {}, req.id);
    return res.status(201).json({
      success: true,
      data: {
        id: review.id,
        fundingStatus: "bank_review_recorded",
        ticketingEnabled: false,
      },
    });
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ error: error.message });
    throw error;
  }
});
router.post("/review/recheck-fare", verifyAdminLoginToken, async (req, res) => {
  try {
    const review = await recheckFare(req.body?.intentId, req.id);
    return res.json({
      success: true,
      data: {
        id: review.id,
        outcome: review.outcome,
        amountMinor: review.amountMinor,
        currency: review.currency,
        expiresAt: review.expiresAt,
        ticketingEnabled: false,
      },
    });
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ error: error.message });
    throw error;
  }
});
module.exports = router;
