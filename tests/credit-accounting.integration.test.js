const test = require("node:test"),
  assert = require("node:assert/strict"),
  mongoose = require("mongoose"),
  jwt = require("jsonwebtoken");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const APIToken = require("../src/models/app-core/APIToken");
const Allocation = require("../src/models/general/CreditAllocation"),
  Funding = require("../src/models/general/CreditFundingReview"),
  Fare = require("../src/models/general/CreditFareReview"),
  Intent = require("../src/models/general/CreditIntent"),
  Link = require("../src/models/general/CreditLink"),
  Event = require("../src/models/general/CreditEvent"),
  User = require("../src/models/user/User"),
  Booking = require("../src/models/general/FlightBooking"),
  Sale = require("../src/models/general/SaleRecord"),
  Payment = require("../src/models/general/Payment"),
  Receipt = require("../src/models/general/PaymentReceipt"),
  Reservation = require("../src/models/general/CreditReservation"),
  BookingAttempt = require("../src/models/general/BookingAttempt"),
  TicketAttempt = require("../src/models/general/TicketIssueAttempt"),
  Session = require("../src/models/general/SessionStore");
const {
  allocateCredit,
  reserveCreditBooking,
  validateCreditPayment,
} = require("../src/services/allocate-credit");
const { issueFlightTicket } = require("../src/services/issue-flight-ticket");
const gateway = require("../src/api/fetcher"),
  sender = require("../src/api/sender");
let repl,
  user,
  intent,
  funding,
  fare,
  bookCalls,
  issueCalls,
  issued,
  providerAmount,
  originalSender,
  originalFetcher;
const models = [
  APIToken,
  Allocation,
  Funding,
  Fare,
  Intent,
  Link,
  Event,
  User,
  Booking,
  Sale,
  Payment,
  Receipt,
  Reservation,
  BookingAttempt,
  TicketAttempt,
  Session,
];
const body = () => ({
  contact_details: {
    c_first_name: "Credit",
    c_last_name: "Review",
    c_email: user.email,
    c_phone_number: "08000000000",
    c_relationship_to_p: "self",
  },
  passenger_details: [
    {
      first_name: "Credit",
      last_name: "Review",
      passenger_type: "adult",
      dob: "1990-01-01",
      gender: "male",
      title: "Mr",
      email: "credit@example.test",
      phone_number: "08000000000",
    },
  ],
});
test.before(async () => {
  repl = await MongoMemoryReplSet.create({
    binary: { version: "7.0.14" },
    replSet: { count: 1, storageEngine: "wiredTiger" },
  });
  await mongoose.connect(repl.getUri(), { dbName: "credit-accounting-local" });
  await Promise.all(models.map((model) => model.init()));
  originalSender = sender.sender_tiqwa;
  originalFetcher = gateway.fetcher_tiqwa;
  sender.sender_tiqwa = async (path) => {
    if (path.includes("/flight/pay/")) {
      issueCalls++;
      issued = true;
      return { status: 200 };
    }
    bookCalls++;
    return {
      status: 200,
      data: {
        reference: "TW-CREDIT",
        amount: 10000.5,
        currency: "NGN",
        status: "booked",
        pricing: { payable: 9000.25 },
        outbound: [
          {
            airline_details: { name: "Local airline", logo: "test-logo" },
            departure_time: "2030-04-20T10:00:00Z",
            arrival_time: "2030-04-20T11:00:00Z",
            airport_from: "LOS",
            airport_to: "ABV",
          },
        ],
      },
    };
  };
  gateway.fetcher_tiqwa = async () => ({
    status: 200,
    data: {
      reference: "TW-CREDIT",
      status: issued ? "issued" : "booked",
      currency: "NGN",
      amount: providerAmount,
    },
  });
});
test.after(async () => {
  sender.sender_tiqwa = originalSender;
  gateway.fetcher_tiqwa = originalFetcher;
  await mongoose.disconnect();
  if (repl) await repl.stop();
});
test.beforeEach(async () => {
  await Promise.all(models.map((model) => model.deleteMany({})));
  bookCalls = 0;
  issueCalls = 0;
  issued = false;
  providerAmount = 10000.5;
  process.env.GOTRIP_ENABLED = "true";
  process.env.GOTRIP_ACCOUNTING_ENABLED = "true";
  process.env.GOTRIP_TICKETING_ENABLED = "false";
  user = await User.create({
    first_name: "Credit",
    last_name: "Review",
    email: "credit@example.test",
    password: "test-password",
    status: "Active",
  });
  intent = await Intent.create({
    owner: user._id,
    requestKey: "selection",
    contextHash: "hash",
    flightId: "OFFER-1",
    origin: "LOS",
    destination: "ABV",
  });
  await Event.create({
    keyHash: "event",
    payloadHash: "body",
    event: "loan.approved",
    loanReference: "LN1",
    providerTransactionReference: "LN1",
    occurredAt: new Date(),
    currency: "NGN",
    loanAmountMinor: "1000050",
    reportedDisbursedMinor: "1000050",
    disposition: "application",
  });
  await Link.create({
    intent: intent._id,
    loanReference: "LN1",
    reviewedBy: new mongoose.Types.ObjectId(),
    reason: "Reviewed application identity",
  });
  funding = await Funding.create({
    intent: intent._id,
    providerReference: "LN1",
    bankReference: "BANK1",
    amountMinor: "1000050",
    currency: "NGN",
    receivedAt: new Date(),
    reviewedBy: new mongoose.Types.ObjectId(),
    reason: "Bank credit checked",
    evidenceHash: "bank-evidence",
  });
  fare = await Fare.create({
    intent: intent._id,
    reviewedBy: new mongoose.Types.ObjectId(),
    flightId: "OFFER-1",
    amountMinor: "1000050",
    fundingMinor: "1000050",
    currency: "NGN",
    outcome: "matched",
    expiresAt: new Date(Date.now() + 300000),
  });
});
async function seedBooking(reference = "TW-CREDIT") {
  const booking = await Booking.create({
    owner: user.email,
    firm: "site",
    api_key: "test-public",
    source_offer_id: "OFFER-1",
    contact_details: body().contact_details,
    passenger_details: body().passenger_details,
    contact_relationship: "self",
    airline: "Local airline",
    airline_logo: "logo",
    departure_time: new Date("2030-04-20"),
    arrival_time: new Date("2030-04-21"),
    origin_code: "LOS",
    destination_code: "ABV",
    origin: "LOS",
    destination: "ABV",
    price: 10000.5,
    currency: "NGN",
    status: "booked",
    payment_status: "pending",
    booking_reference: reference,
  });
  await Sale.create({
    sale_reference: reference,
    purchasing_firm: "site",
    service: "flight",
    service_provider: "tiqwa",
    total_paid: 10000.5,
    service_cost: 9000.25,
    profit: 1000.25,
  });
  return booking;
}
const allocate = (reference = "TW-CREDIT") =>
  allocateCredit({
    intentId: intent.id,
    bookingReference: reference,
    userId: user.id,
    firm: "site",
  });
test("concurrent allocation commits one payment, receipt and paid booking; exact retry is a replay", async () => {
  await seedBooking();
  const results = await Promise.allSettled(
    Array.from({ length: 4 }, () => allocate()),
  );
  assert.ok(results.some((item) => item.status === "fulfilled"));
  assert.equal(await Allocation.countDocuments(), 1);
  assert.equal(await Payment.countDocuments(), 1);
  assert.equal(await Receipt.countDocuments(), 1);
  const payment = await Payment.findOne();
  assert.equal(payment.funding_source, "gotrip");
  assert.equal(Number(payment.amount_paid), 10000.5);
  assert.equal(Number(payment.service_amount), 9000.25);
  assert.equal(Number(payment.commission_amount), 1000.25);
  assert.equal((await Booking.findOne()).payment_status, "paid");
  assert.equal((await Sale.findOne()).status, "completed");
  assert.equal((await allocate()).replay, true);
  assert.equal(issueCalls, 0);
});
test("payment write failure rolls back allocation, receipt, paid status and sale; same request can recover", async () => {
  await seedBooking();
  const create = Payment.create;
  Payment.create = async () => {
    throw new Error("local injected ledger failure");
  };
  try {
    await assert.rejects(allocate(), /ledger failure/);
  } finally {
    Payment.create = create;
  }
  assert.equal(await Allocation.countDocuments(), 0);
  assert.equal(await Receipt.countDocuments(), 0);
  assert.equal((await Booking.findOne()).payment_status, "pending");
  assert.equal((await Sale.findOne()).status, "pending");
  assert.equal((await allocate()).replay, false);
});
test("same funding cannot pay a second booking", async () => {
  await seedBooking();
  await seedBooking("TW-OTHER");
  await allocate();
  await assert.rejects(allocate("TW-OTHER"));
  assert.equal(await Payment.countDocuments(), 1);
  assert.equal(
    (await Booking.findOne({ booking_reference: "TW-OTHER" })).payment_status,
    "pending",
  );
});
for (const [name, change] of [
  ["foreign owner", { owner: "other@example.test" }],
  ["different offer", { source_offer_id: "OTHER" }],
  ["wrong amount", { price: 10000.51 }],
  ["wrong currency", { currency: "USD" }],
  ["cancelled reservation", { status: "cancelled" }],
])
  test(`allocation refuses ${name}`, async () => {
    const booking = await seedBooking();
    await Booking.updateOne({ _id: booking._id }, { $set: change });
    await assert.rejects(allocate());
    assert.equal(await Payment.countDocuments(), 0);
    assert.equal(await Receipt.countDocuments(), 0);
  });
test("expired or failed fare review and inconsistent sale totals cannot allocate funds", async () => {
  await seedBooking();
  await Fare.updateOne({ _id: fare._id }, { $set: { expiresAt: new Date(0) } });
  await assert.rejects(allocate(), /fresh matched fare/);
  await Fare.updateOne(
    { _id: fare._id },
    { $set: { expiresAt: new Date(Date.now() + 300000) } },
  );
  await Sale.updateOne({}, { $set: { profit: 1000.26 } });
  await assert.rejects(allocate(), /balance/);
  assert.equal(await Allocation.countDocuments(), 0);
});
test("credit reservation retries reuse the provider booking; changing travellers cannot rebook", async () => {
  const input = {
    intentId: intent.id,
    userId: user.id,
    firm: "site",
    apiKey: "test-public",
    body: body(),
  };
  const result = await reserveCreditBooking(input);
  assert.equal(result.booking.payment_status, "paid");
  assert.equal(bookCalls, 1);
  assert.equal((await reserveCreditBooking(input)).replay, true);
  assert.equal(bookCalls, 1);
  await assert.rejects(
    reserveCreditBooking({
      ...input,
      body: { ...body(), passenger_details: [{ first_name: "Different" }] },
    }),
    /different details/,
  );
  assert.equal(bookCalls, 1);
});
test("reservation survives accounting failure and retry recovers without another provider reservation", async () => {
  const input = {
    intentId: intent.id,
    userId: user.id,
    firm: "site",
    apiKey: "test-public",
    body: body(),
  };
  const create = Payment.create;
  Payment.create = async () => {
    throw new Error("ledger failure");
  };
  try {
    await assert.rejects(reserveCreditBooking(input), /ledger failure/);
  } finally {
    Payment.create = create;
  }
  assert.equal(bookCalls, 1);
  assert.equal(await Reservation.countDocuments(), 1);
  assert.equal((await Booking.findOne()).payment_status, "pending");
  await reserveCreditBooking(input);
  assert.equal(bookCalls, 1);
  assert.equal(await Payment.countDocuments(), 1);
});
test("real ticketing gate blocks provider pay even for an allocated credit booking", async () => {
  await seedBooking();
  await allocate();
  await assert.rejects(
    issueFlightTicket({ firm: "site", reference: "TW-CREDIT", admin: "staff" }),
    /not enabled/,
  );
  assert.equal(issueCalls, 0);
  assert.equal((await Booking.findOne()).status, "booked");
});
test("stubbed credit issuance validates proof and issues once without Paystack verification", async () => {
  await seedBooking();
  await allocate();
  process.env.GOTRIP_TICKETING_ENABLED = "true";
  const result = await issueFlightTicket({
    firm: "site",
    reference: "TW-CREDIT",
    admin: "staff",
  });
  assert.equal(result.booking.status, "issued");
  assert.equal(issueCalls, 1);
  assert.equal(
    (
      await issueFlightTicket({
        firm: "site",
        reference: "TW-CREDIT",
        admin: "staff",
      })
    ).replay,
    true,
  );
  assert.equal(issueCalls, 1);
});
test("tampered credit payment or changed provider amount cannot reach provider payment", async () => {
  const booking = await seedBooking();
  await allocate();
  let payment = await Payment.findOne();
  await Payment.updateOne(
    { _id: payment._id },
    { $set: { amount_paid: 10000.51 } },
  );
  payment = await Payment.findById(payment._id);
  await assert.rejects(validateCreditPayment(booking, payment));
  await Payment.updateOne(
    { _id: payment._id },
    { $set: { amount_paid: 10000.5 } },
  );
  providerAmount = 10000.51;
  process.env.GOTRIP_TICKETING_ENABLED = "true";
  await assert.rejects(
    issueFlightTicket({ firm: "site", reference: "TW-CREDIT", admin: "staff" }),
    /amount changed/,
  );
  assert.equal(issueCalls, 0);
});
test("allocation is disabled by default, rejects foreign intent ownership and requires bank evidence", async () => {
  await seedBooking();
  process.env.GOTRIP_ACCOUNTING_ENABLED = "false";
  await assert.rejects(allocate(), /not enabled/);
  process.env.GOTRIP_ACCOUNTING_ENABLED = "true";
  await assert.rejects(
    allocateCredit({
      intentId: intent.id,
      bookingReference: "TW-CREDIT",
      userId: new mongoose.Types.ObjectId().toString(),
      firm: "site",
    }),
    /not found/,
  );
  await Funding.deleteMany({});
  await assert.rejects(allocate(), /Bank funding review/);
  assert.equal(await Payment.countDocuments(), 0);
});
test("HTTP allocation requires the owning customer session and exposes the linked booking without bank evidence", async () => {
  await seedBooking();
  process.env.JWT_USER_SECRET_KEY = "local-credit-session";
  await Session.create({
    owner: user.id,
    key: "local-credit-owner",
    value: jwt.sign({ id: user.id }, process.env.JWT_USER_SECRET_KEY, {
      expiresIn: "1h",
    }),
  });
  const { createApp } = require("../server/createApp");
  const server = createApp().listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/v1/credit`;
  try {
    const request = (headers) =>
      fetch(`${base}/intents/${intent.id}/allocate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          firm: "site",
          ...headers,
        },
        body: JSON.stringify({ bookingReference: "TW-CREDIT" }),
      });
    assert.equal((await request({})).status, 401);
    assert.equal(
      (await request({ "u-x-key": "local-credit-owner" })).status,
      200,
    );
    const list = await (
      await fetch(base + "/intents", {
        headers: { "u-x-key": "local-credit-owner" },
      })
    ).json();
    assert.equal(list.data[0].allocationStatus, "allocated");
    assert.equal(list.data[0].bookingReference, "TW-CREDIT");
    assert.equal(list.data[0].ticketStatus, "not_issued");
    assert.equal(list.data[0].status, "allocated_to_booking");
    assert.ok(!JSON.stringify(list).includes("BANK1"));
    process.env.GOTRIP_TICKETING_ENABLED = "true";
    await issueFlightTicket({
      firm: "site",
      reference: "TW-CREDIT",
      admin: "staff",
    });
    const issuedList = await (
      await fetch(base + "/intents", {
        headers: { "u-x-key": "local-credit-owner" },
      })
    ).json();
    assert.equal(issuedList.data[0].status, "ticket_issued");
    assert.equal(issuedList.data[0].ticketStatus, "issued");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
test("missing or altered funding/receipt evidence blocks an existing paid credit booking from ticketing", async () => {
  await seedBooking();
  await allocate();
  process.env.GOTRIP_TICKETING_ENABLED = "true";
  await Receipt.updateOne({}, { $set: { credit_allocation: "unrelated" } });
  await assert.rejects(
    issueFlightTicket({ firm: "site", reference: "TW-CREDIT", admin: "staff" }),
    /receipt/,
  );
  assert.equal(issueCalls, 0);
});
test("departed flights and inconsistent sale state cannot receive a credit allocation", async () => {
  const booking = await seedBooking();
  await Booking.updateOne(
    { _id: booking._id },
    { $set: { departure_time: new Date(0) } },
  );
  await assert.rejects(allocate(), /departure/);
  await Booking.updateOne(
    { _id: booking._id },
    { $set: { departure_time: new Date("2030-04-20") } },
  );
  await Sale.updateOne({}, { $set: { status: "completed" } });
  await assert.rejects(allocate(), /Sale status/);
  assert.equal(await Payment.countDocuments(), 0);
});
test("an already allocated existing booking is resumed without a new reservation attempt", async () => {
  await seedBooking();
  await allocate();
  const result = await reserveCreditBooking({
    intentId: intent.id,
    userId: user.id,
    firm: "site",
    apiKey: "test-public",
    body: body(),
  });
  assert.equal(result.replay, true);
  assert.equal(bookCalls, 0);
  assert.equal(await Booking.countDocuments(), 1);
});
test("HTTP credit checkout validates session, firm key and travellers, then reserves and allocates without Paystack", async () => {
  process.env.JWT_USER_SECRET_KEY = "local-checkout-session";
  await Session.create({
    owner: user.id,
    key: "checkout-owner",
    value: jwt.sign({ id: user.id }, process.env.JWT_USER_SECRET_KEY, {
      expiresIn: "1h",
    }),
  });
  await APIToken.create({
    firm: "site",
    api_key: "local-public-key",
    action_by: "local-test",
  });
  const { createApp } = require("../server/createApp");
  const server = createApp().listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/v1/credit/intents/${intent.id}/book`;
  const request = (key = "local-public-key", payload = body()) =>
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "u-x-key": "checkout-owner",
        firm: "site",
        api_key: key,
      },
      body: JSON.stringify(payload),
    });
  try {
    assert.equal((await request("wrong-key")).status, 401);
    assert.equal(bookCalls, 0);
    assert.notEqual((await request("local-public-key", {})).status, 200);
    assert.equal(bookCalls, 0);
    const response = await request();
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.data.paymentStatus, "paid");
    assert.equal(result.data.ticketStatus, "booked");
    assert.equal(bookCalls, 1);
    assert.equal(issueCalls, 0);
    const retry = await request();
    assert.equal(retry.status, 200);
    assert.equal((await retry.json()).data.replay, true);
    assert.equal(bookCalls, 1);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
