const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const axios = require("axios");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const Flight = require("../src/models/general/FlightBooking");
const Shortlet = require("../src/models/general/ShortletBooking");
const Payment = require("../src/models/general/Payment");
const Receipt = require("../src/models/general/PaymentReceipt");
const Sale = require("../src/models/general/SaleRecord");
const Markup = require("../src/models/app-core/Markup");
const HostBalance = require("../src/models/host/HostBalance");
const HostEarning = require("../src/models/host/HostEarning");
const Attempt = require("../src/models/general/BookingAttempt");
const User = require("../src/models/user/User");
const Session = require("../src/models/general/SessionStore");
const jwt = require("jsonwebtoken");
const Host = require("../src/models/host/Host");
const Notification = require("../src/models/general/Notification");
const BankAccount = require("../src/models/host/HostBankAccount");
const Withdrawal = require("../src/models/host/HostWithdrawal");
const Listing = require("../src/models/host/ShortLet");
const Admin = require("../src/models/admin/Admin");
const transferGateway = require("../src/services/paystack-transfers");
const originalTransferGateway = { ...transferGateway };
const RateBucket = require("../src/models/general/AuthRateBucket");
const AdminLoginToken = require("../src/models/admin/AdminLoginToken");
let transferCalls, transferStatus;
const { recordPayment } = require("../src/services/record-payment");
let repl, originalGet, originalSender, originalFetcher, providerCalls;
const flightData = (ref = "TW-example") => ({ owner: "owner@example.test", firm: "site", api_key: "test-public",
  contact_details: { c_first_name: "First", c_last_name: "Last", c_email: "owner@example.test", c_relationship_to_p: "self" },
  passenger_details: [{ first_name: "First" }], contact_relationship: "self", airline: "Example", airline_logo: "example-logo",
  departure_time: new Date("2026-12-12"), arrival_time: new Date("2026-12-13"), origin_code: "LOS", destination_code: "LHR",
  origin: "LOS", destination: "LHR", price: 1000, status: "booked", booking_reference: ref });

test.before(async () => {
  // Ephemeral loopback-only replica set. Never connects to DB_URI/production.
  repl = await MongoMemoryReplSet.create({ binary: { version: "7.0.14" }, replSet: { count: 1, storageEngine: "wiredTiger" } });
  await mongoose.connect(repl.getUri(), { dbName: "security-regression" });
  await Promise.all([Flight, Shortlet, Payment, Receipt, Sale, Markup, HostBalance, HostEarning, Attempt, User, Session, Host, Notification, BankAccount, Withdrawal, Listing, Admin, RateBucket, AdminLoginToken].map(model => model.init()));
  process.env.PAYSTACK_SECRET = "test-secret";
  process.env.JWT_USER_SECRET_KEY = "test-session-secret";
  process.env.JWT_HOST_SECRET_KEY = "test-host-session-secret";
  process.env.JWT_ADMIN_SECRET_KEY = "test-admin-session-secret";
  originalGet = axios.get;
  axios.get = async url => ({ data: { status: true, data: { status: "success", reference: url.split("/").at(-1),
    amount: 100000, currency: "NGN", customer: { email: "owner@example.test" },
    metadata: { booking_reference: "TW-example" }, paid_at: "2026-11-07T10:00:00Z" } } });
  const sender = require("../src/api/sender"); originalSender = sender.sender_tiqwa;
  const fetcher = require("../src/api/fetcher"); originalFetcher = fetcher.fetcher_tiqwa;
  fetcher.fetcher_tiqwa = async () => ({ status: 200, data: { reference: "TW-example", status: "booked" } });
  sender.sender_tiqwa = async () => { providerCalls++; return { status: 200, data: {
    reference: "TW-example", amount: 1000, status: "booked", currency: "NGN",
    pricing: { payable: 900, markup: { markup_value: 100 } }, outbound: [{
      airline_details: { name: "Example", logo: "example-logo" }, departure_time: "2026-12-12", arrival_time: "2026-12-13",
      airport_from: "LOS", airport_to: "LHR",
    }],
  } }; };
});
test.after(async () => {
  if (originalGet) axios.get = originalGet;
  if (originalSender) require("../src/api/sender").sender_tiqwa = originalSender;
  if (originalFetcher) require("../src/api/fetcher").fetcher_tiqwa = originalFetcher;
  Object.assign(transferGateway, originalTransferGateway);
  await mongoose.disconnect(); if (repl) await repl.stop();
});
test.beforeEach(async () => {
  providerCalls = 0;
  transferCalls = 0; transferStatus = "success";
  transferGateway.createRecipient = async () => ({ recipient_code: "RCP_test" });
  transferGateway.initiateTransfer = async () => { transferCalls++; return { status: "pending" }; };
  transferGateway.verifyTransfer = async reference => ({ reference, amount: 10000, currency: "NGN",
    recipient: { recipient_code: "RCP_test" }, status: transferStatus, transfer_code: "TRF_test" });
  await Promise.all(Object.values(mongoose.models).map(model => model.deleteMany({})));
  await Markup.collection.insertMany([{ service_name: "flight", commission: 10 }, { service_name: "shortlet", commission: 10 }]);
});
async function seedFlight() {
  await Flight.create(flightData());
  await Sale.create({ purchasing_firm: "site", sale_reference: "TW-example", service: "flight", service_provider: "tiqwa", total_paid: 1000, service_cost: 900, profit: 100 });
}
const input = { service: "flight", firm: "site", bookingReference: "TW-example", transactionReference: "payment-1" };

test("real replica set: concurrent duplicate payment requests produce one receipt and ledger entry", async () => {
  await seedFlight();
  const results = await Promise.allSettled([recordPayment(input), recordPayment(input)]);
  assert.ok(results.some(result => result.status === "fulfilled"));
  assert.equal(await Payment.countDocuments(), 1);
  assert.equal(await Receipt.countDocuments(), 1);
  assert.equal((await Flight.findOne()).payment_status, "paid");
  assert.equal((await Sale.findOne()).status, "completed");
  const retry = await recordPayment(input);
  assert.equal(retry.replay, true);
  assert.equal(await Payment.countDocuments(), 1);
});

test("real replica set: missing host account rolls back payment, sale, earning, and booking changes", async () => {
  await Shortlet.create({ owner: "owner@example.test", firm: "site", api_key: "test-public", apartment_id: "property",
    apartment_name: "Example", apartment_img: { url: "example" }, apartment_address: "Example", apartment_city: "Lagos",
    apartment_state: "Lagos", apartment_country: "NG", apartment_owner: "host", name: "First Last", email: "owner@example.test",
    check_in_date: new Date("2026-12-12"), check_out_date: new Date("2026-12-13"), number_of_days: "1",
    price: 1000, status: "confirmed", booking_reference: "TW-example" });
  await assert.rejects(recordPayment({ ...input, service: "shortlet", user: { email: "owner@example.test" } }), e => e.status === 409);
  assert.equal(await Payment.countDocuments(), 0); assert.equal(await Receipt.countDocuments(), 0);
  assert.equal(await Sale.countDocuments(), 0); assert.equal(await HostEarning.countDocuments(), 0);
  assert.equal((await Shortlet.findOne()).payment_status, "pending");
  assert.equal((await Shortlet.findOne()).status, "confirmed");
});

test("real replica set: shortlet retries credit the host once", async () => {
  await Shortlet.collection.insertOne({ ...flightData(), contact_details: undefined,
    name: "First Last", email: "owner@example.test", apartment_owner: "host", apartment_name: "Example",
    apartment_id: "property", apartment_img: { url: "example" }, apartment_address: "Example",
    apartment_city: "Lagos", apartment_state: "Lagos", apartment_country: "NG",
    check_in_date: new Date("2026-12-12"), check_out_date: new Date("2026-12-13"), number_of_days: "1",
    status: "confirmed", payment_status: "pending" });
  await HostBalance.create({ owner: "host" });
  const request = { ...input, service: "shortlet", user: { email: "owner@example.test" } };
  await recordPayment(request); await recordPayment(request);
  const balance = await HostBalance.findOne({ owner: "host" });
  assert.equal(Number(balance.available_balance), 900);
  assert.equal(Number(balance.total_earnings), 900);
  assert.equal(await HostEarning.countDocuments(), 1);
});

test("real replica set: local booking failure is recoverable without a second provider reservation", async () => {
  const { createFlightBooking } = require("../src/services/create-flight-booking");
  const request = { firm: "site", apiKey: "test-public", offer: "offer-1", body: {
    contact_details: flightData().contact_details, passenger_details: flightData().passenger_details,
  } };
  const create = Sale.create; Sale.create = async () => { throw new Error("Simulated local write failure"); };
  try { await assert.rejects(createFlightBooking(request)); } finally { Sale.create = create; }
  assert.equal(providerCalls, 1); assert.equal(await Flight.countDocuments(), 0);
  assert.equal((await Attempt.findOne()).state, "provider_confirmed");
  const recovered = await createFlightBooking(request);
  assert.equal(recovered.booking_reference, "TW-example");
  assert.equal(await Flight.countDocuments(), 1); assert.equal(await Sale.countDocuments(), 1);
  await createFlightBooking(request);
  assert.equal(providerCalls, 1); assert.equal(await Flight.countDocuments(), 1);
});

test("real replica set: uncertain provider attempt is not automatically retried", async () => {
  const { createFlightBooking, attemptKey } = require("../src/services/create-flight-booking");
  const body = { contact_details: flightData().contact_details, passenger_details: [] };
  await Attempt.create({ _id: attemptKey("site", "offer-2", body), state: "provider_pending" });
  await assert.rejects(createFlightBooking({ firm: "site", apiKey: "test-public", offer: "offer-2", body }), e => e.status === 409);
  assert.equal(providerCalls, 0);
});

test("real replica set: partner response survives local failure and concurrent retries without rebooking", async () => {
  const { createFlightBooking } = require("../src/services/create-flight-booking");
  const request = { firm: "partner", apiKey: "partner-key", offer: "partner-offer", returnProviderResponse: true,
    body: { contact_details: flightData().contact_details, passenger_details: flightData().passenger_details } };
  const create = Sale.create;
  Sale.create = async () => { throw new Error("Local ledger unavailable"); };
  try { await assert.rejects(createFlightBooking(request)); } finally { Sale.create = create; }
  assert.equal(await Flight.countDocuments(), 0);
  const [first, second] = await Promise.all([createFlightBooking(request), createFlightBooking(request)]);
  assert.equal(providerCalls, 1);
  assert.equal(await Flight.countDocuments(), 1);
  assert.equal(await Sale.countDocuments(), 1);
  assert.equal(String(first.booking._id), String(second.booking._id));
  assert.deepEqual(first.providerResponse, second.providerResponse);
  assert.equal(first.providerResponse.reference, "TW-example");
  assert.equal(first.providerResponse.outbound[0].airport_from, "LOS");
  assert.equal(first.booking.payment_status, "pending");
  assert.equal((await Attempt.findOne()).state, "completed");
});

test("HTTP: partner booking returns a scoped receipt and preserves its response on retry", async () => {
  const APIToken = require("../src/models/app-core/APIToken");
  await APIToken.create({ firm: "partner", api_key: "partner-key", action_by: "test-admin" });
  const { createApp } = require("../server/createApp");
  const server = createApp().listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/v1/flight`;
  const headers = { firm: "partner", api_key: "partner-key", "Content-Type": "application/json" };
  const body = JSON.stringify({
    contact_details: { ...flightData().contact_details, c_phone_number: "123456789" },
    passenger_details: [{ passenger_type: "adult", first_name: "First", last_name: "Last", dob: "1990-01-01",
      gender: "male", title: "Mr", email: "owner@example.test", phone_number: "123456789" }],
  });
  try {
    for (let i = 0; i < 2; i++) {
      const response = await fetch(`${base}/book-flight-tp/partner-offer`, { method: "POST", headers, body });
      assert.equal(response.status, 200);
      const result = await response.json();
      assert.equal(result.data.reference, "TW-example");
      const claims = jwt.verify(result.booking_access_token, process.env.JWT_USER_SECRET_KEY, {
        algorithms: ["HS256"], audience: "borderless-booking-receipt",
      });
      assert.equal(claims.firm, "partner");
      assert.equal(claims.booking_reference, "TW-example");
      // The public partner key alone must not reveal passenger/ticket data.
      const denied = await fetch(`${base}/flight-ticket-details/TW-example`, { headers });
      assert.equal(denied.status, 404);
      const allowed = await fetch(`${base}/flight-ticket-details/TW-example`, {
        headers: { ...headers, Authorization: `Bearer ${result.booking_access_token}` },
      });
      assert.equal(allowed.status, 200);
    }
    assert.equal(providerCalls, 1);
    assert.equal(await Flight.countDocuments(), 1);
    assert.equal(await Sale.countDocuments(), 1);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test("HTTP: authenticated user cannot read another user's booking or change account security fields", async () => {
  const { createApp } = require("../server/createApp");
  const user = await User.create({ first_name: "First", last_name: "Last", email: "signed-in@example.test", password: "test-password", email_verified: true });
  await Session.create({ owner: String(user._id), key: "test-session", value: jwt.sign({ id: String(user._id) }, process.env.JWT_USER_SECRET_KEY, { expiresIn: "1h" }) });
  const foreign = await Flight.create(flightData());
  const server = createApp().listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;
  try {
    const denied = await fetch(`${base}/user-profile/single-flight-booking/${foreign._id}`, { headers: { "u-x-key": "test-session" } });
    assert.equal(denied.status, 404); assert.equal((await denied.json()).error, "Booking not found");
    const own = await Flight.create({ ...flightData("TW-own"), owner: user.email });
    const allowed = await fetch(`${base}/user-profile/single-flight-booking/${own._id}`, { headers: { "u-x-key": "test-session" } });
    assert.equal(allowed.status, 200); assert.equal(allowed.headers.get("cache-control"), "private, no-store");
    const data = (await allowed.json()).data;
    assert.equal(data.api_key, undefined); assert.equal(data.firm, undefined);
    const changed = await fetch(`${base}/user-profile/update-profile`, { method: "PUT", headers: { "u-x-key": "test-session", "Content-Type": "application/json" }, body: JSON.stringify({
      first_name: "Updated", last_name: "Person", username: "user", phone: "123456789", email: "other@example.test", password: "hijacked", email_verified: false,
    }) });
    assert.equal(changed.status, 200); assert.equal((await changed.json()).data.password, undefined);
    const saved = await User.findById(user._id); assert.equal(saved.email, user.email); assert.equal(saved.password, "test-password"); assert.equal(saved.email_verified, true);
    for (const endpoint of ["fetch-users", "fetch-hosts", "fetch-waitlists"]) {
      assert.equal((await fetch(`${base}/website/${endpoint}`)).status, 401);
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test("HTTP: host cannot change approval/security fields or open another host's notification", async () => {
  const host = await Host.create({ first_name: "First", last_name: "Last", email: "host@example.test", password: "unchanged-password" });
  const owner = String(host._id);
  await Session.create({ owner, key: "host-session", value: jwt.sign({ id: owner }, process.env.JWT_HOST_SECRET_KEY, { expiresIn: "1h" }) });
  const own = await Notification.create({ owner, type: "booking", title: "Own", description: "Own notification" });
  const foreign = await Notification.create({ owner: "other-host", type: "booking", title: "Private", description: "Private notification" });
  const { createApp } = require("../server/createApp");
  const server = createApp().listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/v1/host-app/profile`;
  const headers = { "u-x-key": "host-session", "Content-Type": "application/json" };
  try {
    const changed = await fetch(`${base}/update-profile`, { method: "PUT", headers, body: JSON.stringify({
      first_name: "Updated", email: "hijacked@example.test", password: "hijacked-password", email_verified: true,
      status: "Approved", properties: 100, guests: 100,
    }) });
    assert.equal(changed.status, 200);
    assert.equal((await changed.json()).data.password, undefined);
    const saved = await Host.findById(owner);
    assert.equal(saved.first_name, "Updated"); assert.equal(saved.email, "host@example.test");
    assert.equal(saved.password, "unchanged-password"); assert.equal(saved.email_verified, false);
    assert.equal(saved.status, "Pending"); assert.equal(saved.properties, 0); assert.equal(saved.guests, 0);
    const notifications = await (await fetch(`${base}/notifications`, { headers })).json();
    assert.equal(notifications.data.length, 1);
    assert.equal(notifications.data[0]._id, String(own._id));
    const denied = await fetch(`${base}/open-notification/${foreign._id}`, { method: "PUT", headers });
    assert.equal(denied.status, 404);
    assert.equal((await Notification.findById(foreign._id)).status, "pending");
    assert.equal((await fetch(`${base}/open-notification/${own._id}`, { method: "PUT", headers })).status, 200);
    assert.equal((await Notification.findById(own._id)).status, "opened");
  } finally { await new Promise(resolve => server.close(resolve)); }
});

async function seedWithdrawal() {
  await HostBalance.create({ owner: "host", available_balance: 1000 });
  return BankAccount.create({ owner: "host", account_name: "Saved Name", account_number: "1234567890", bank_data: { code: "123", name: "Saved Bank" } });
}

async function seedReview() {
  await seedWithdrawal();
  return require("../src/services/request-host-withdrawal").requestHostWithdrawal("host", 100, withdrawalBank);
}

test("real replica set: concurrent rejection releases a reservation once and completed payouts cannot be rejected", async () => {
  const { rejectHostWithdrawal } = require("../src/services/review-host-withdrawal");
  const request = await seedReview();
  await Promise.all([rejectHostWithdrawal(String(request._id), "admin", "Not approved"), rejectHostWithdrawal(String(request._id), "admin", "Not approved")]);
  assert.equal(Number((await HostBalance.findOne()).available_balance), 1000);
  assert.equal(await Notification.countDocuments(), 1);
  assert.equal((await Withdrawal.findById(request._id)).funds_reserved, false);
  await Withdrawal.updateOne({ _id: request._id }, { $set: { status: "completed" } });
  await assert.rejects(rejectHostWithdrawal(String(request._id), "admin", "Try again"), e => e.status === 409);
  assert.equal(Number((await HostBalance.findOne()).available_balance), 1000);
});

test("real replica set: payout uses kobo and stable reference, pending is not completed, retries never resend", async () => {
  const { approveHostWithdrawal, rejectHostWithdrawal } = require("../src/services/review-host-withdrawal");
  const request = await seedReview(); const id = String(request._id);
  transferStatus = "pending";
  transferGateway.initiateTransfer = async body => {
    transferCalls++;
    assert.equal(body.amount, 10000); assert.equal(body.currency, "NGN");
    assert.equal(body.reference, `withdrawal_${id}`); assert.equal(body.recipient, "RCP_test");
    return { status: "pending" };
  };
  assert.equal((await approveHostWithdrawal(id, "admin")).status, "processing");
  assert.equal(Number((await HostBalance.findOne()).total_withdrawals), 0);
  await assert.rejects(rejectHostWithdrawal(id, "admin", "Decline"), e => e.status === 409);
  transferStatus = "success";
  await Promise.all([approveHostWithdrawal(id, "admin"), approveHostWithdrawal(id, "other-admin")]);
  assert.equal(transferCalls, 1);
  const saved = await Withdrawal.findById(id);
  assert.equal(saved.status, "completed"); assert.equal(saved.transaction_id, "TRF_test");
  assert.equal(saved.funds_reserved, false);
  assert.equal(Number((await HostBalance.findOne()).available_balance), 900);
  assert.equal(Number((await HostBalance.findOne()).total_withdrawals), 100);
  assert.equal(await Notification.countDocuments(), 1);
});

test("real replica set: uncertain transfer POST is never repeated or refunded by rejection", async () => {
  const { approveHostWithdrawal, rejectHostWithdrawal } = require("../src/services/review-host-withdrawal");
  const request = await seedReview(); const id = String(request._id);
  transferGateway.initiateTransfer = async () => { transferCalls++; throw new Error("Provider timeout"); };
  transferGateway.verifyTransfer = async () => { throw new Error("Provider status unavailable"); };
  await assert.rejects(approveHostWithdrawal(id, "admin"));
  await assert.rejects(approveHostWithdrawal(id, "admin"));
  await assert.rejects(rejectHostWithdrawal(id, "admin", "Decline"), e => e.status === 409);
  assert.equal(transferCalls, 1);
  assert.equal((await Withdrawal.findById(id)).status, "processing");
  assert.equal(Number((await HostBalance.findOne()).available_balance), 900);
  assert.equal(Number((await HostBalance.findOne()).total_withdrawals), 0);
});

test("real replica set: mismatched payout verification cannot mark a request complete", async () => {
  const { approveHostWithdrawal } = require("../src/services/review-host-withdrawal");
  const request = await seedReview(); const id = String(request._id);
  transferStatus = "pending";
  await approveHostWithdrawal(id, "admin");
  for (const change of [{ amount: 100 }, { currency: "USD" }, { reference: "another" }, { recipient: { recipient_code: "another" } }, { status: "failed" }, { transfer_code: null }]) {
    transferGateway.verifyTransfer = async reference => ({ reference, amount: 10000, currency: "NGN",
      recipient: { recipient_code: "RCP_test" }, status: "success", transfer_code: "TRF_test", ...change });
    await assert.rejects(approveHostWithdrawal(id, "admin"), e => e.status === 409);
  }
  assert.equal(transferCalls, 1);
  assert.equal((await Withdrawal.findById(id)).status, "processing");
  assert.equal(Number((await HostBalance.findOne()).total_withdrawals), 0);
});

test("real replica set: payout completion rollback is recovered by verification without a second transfer", async () => {
  const { approveHostWithdrawal } = require("../src/services/review-host-withdrawal");
  const request = await seedReview(); const id = String(request._id);
  const create = Notification.create;
  Notification.create = async () => { throw new Error("Notification storage unavailable"); };
  try { await assert.rejects(approveHostWithdrawal(id, "admin")); } finally { Notification.create = create; }
  assert.equal((await Withdrawal.findById(id)).status, "processing");
  assert.equal(Number((await HostBalance.findOne()).total_withdrawals), 0);
  await approveHostWithdrawal(id, "admin");
  assert.equal(transferCalls, 1);
  assert.equal((await Withdrawal.findById(id)).status, "completed");
  assert.equal(Number((await HostBalance.findOne()).total_withdrawals), 100);
});

test("real replica set: legacy unverified reservations fail closed for approval and rejection", async () => {
  const { approveHostWithdrawal, rejectHostWithdrawal } = require("../src/services/review-host-withdrawal");
  const request = await seedReview(); const id = String(request._id);
  await Withdrawal.updateOne({ _id: id }, { $unset: { funds_reserved: 1 } });
  await assert.rejects(approveHostWithdrawal(id, "admin"), e => e.status === 409);
  await assert.rejects(rejectHostWithdrawal(id, "admin", "Decline"), e => e.status === 409);
  assert.equal(transferCalls, 0);
  assert.equal(Number((await HostBalance.findOne()).available_balance), 900);
});

test("HTTP: listing and booking routes require host ownership and exclude partner credentials", async () => {
  const host = await Host.create({ first_name: "First", last_name: "Last", email: "host@example.test", password: "test-password" });
  const otherHost = new mongoose.Types.ObjectId();
  const owner = String(host._id);
  await Session.create({ owner, key: "listing-session", value: jwt.sign({ id: owner }, process.env.JWT_HOST_SECRET_KEY, { expiresIn: "1h" }) });
  const listingData = { owner: host._id, apartment_name: "Own", country: "NG", state: "Lagos", lga: "Ikeja", address: "Example",
    email: "host@example.test", phone: "123456789", images: [], description: "Example property" };
  const own = await Listing.create(listingData);
  const foreign = await Listing.create({ ...listingData, owner: otherHost, apartment_name: "Foreign" });
  const booked = await Shortlet.collection.insertOne({ apartment_owner: owner, api_key: "secret-key", firm: "site", status: "paid", payment_status: "paid" });
  const foreignBooking = await Shortlet.collection.insertOne({ apartment_owner: String(otherHost), api_key: "foreign-key", firm: "site" });
  const { createApp } = require("../server/createApp");
  const server = createApp().listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/v1/host-app/listing-management`;
  const headers = { "u-x-key": "listing-session", "Content-Type": "application/json" };
  try {
    for (const [method, route] of [["PUT", `mark-listing-available/${foreign._id}`], ["PUT", `mark-listing-unavailable/${foreign._id}`],
      ["GET", `listing/${foreign._id}`], ["GET", `single-shortlet-booking/${foreignBooking.insertedId}`]]) {
      assert.equal((await fetch(`${base}/${route}`, { method })).status, 401);
      assert.equal((await fetch(`${base}/${route}`, { method, headers })).status, 404);
    }
    const updated = await fetch(`${base}/update-listing/${own._id}`, { method: "PUT", headers,
      body: JSON.stringify({ apartment_name: "Updated", owner: String(otherHost), status: "unavailable", createdAt: "2000-01-01", "$set": { owner: String(otherHost) } }) });
    assert.equal(updated.status, 200);
    const saved = await Listing.findById(own._id);
    assert.equal(saved.apartment_name, "Updated"); assert.equal(String(saved.owner), owner); assert.equal(saved.status, "available");
    assert.equal((await fetch(`${base}/mark-listing-unavailable/${own._id}`, { method: "PUT", headers })).status, 200);
    assert.equal((await Listing.findById(own._id)).status, "unavailable");
    const booking = await (await fetch(`${base}/single-shortlet-booking/${booked.insertedId}`, { headers })).json();
    assert.equal(booking.data.api_key, undefined); assert.equal(booking.data.firm, undefined);
    assert.equal((await fetch(`${base}/decline-booking/${booked.insertedId}`, { method: "PUT", headers })).status, 409);
    assert.equal((await Shortlet.findById(booked.insertedId)).status, "paid");
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test("HTTP: admin payout routes deny missing, deleted and mismatched administrator sessions", async () => {
  const admin = await Admin.create({ first_name: "Admin", last_name: "Person", email: "admin@example.test", password: "test-password" });
  const owner = String(admin._id);
  await Session.create({ owner, key: "admin-session", value: jwt.sign({ id: owner }, process.env.JWT_ADMIN_SECRET_KEY, { expiresIn: "1h" }) });
  const request = await seedReview();
  const { createApp } = require("../server/createApp");
  const server = createApp().listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/v1/admin-app/host-management`;
  try {
    const url = `${base}/approve-withdrawal-request/${request._id}`;
    assert.equal((await fetch(url, { method: "PUT" })).status, 401);
    await Session.updateOne({ key: "admin-session" }, { $set: { owner: String(new mongoose.Types.ObjectId()) } });
    assert.equal((await fetch(url, { method: "PUT", headers: { "a-x-key": "admin-session" } })).status, 401);
    await Session.updateOne({ key: "admin-session" }, { $set: { owner } });
    await Admin.deleteOne({ _id: owner });
    assert.equal((await fetch(url, { method: "PUT", headers: { "a-x-key": "admin-session" } })).status, 401);
    assert.equal(transferCalls, 0);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test("real replica set: host approval and decline race commits one booking decision and notification", async () => {
  const { reviewHostBooking } = require("../src/services/review-host-booking");
  await User.create({ first_name: "First", last_name: "Last", email: "owner@example.test", password: "test-password" });
  const booking = await Shortlet.create({ owner: "owner@example.test", firm: "site", api_key: "private", apartment_id: "property",
    apartment_name: "Example", apartment_img: { url: "example" }, apartment_address: "Example", apartment_city: "Lagos",
    apartment_state: "Lagos", apartment_country: "NG", apartment_owner: "host", name: "First Last", email: "owner@example.test",
    check_in_date: new Date("2026-12-12"), check_out_date: new Date("2026-12-13"), number_of_days: "1", price: 1000, booking_reference: "stay-review" });
  const results = await Promise.allSettled([reviewHostBooking(booking._id, "host", "confirmed"), reviewHostBooking(booking._id, "host", "declined")]);
  assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
  assert.equal(results.find(r => r.status === "rejected").reason.status, 409);
  assert.equal(await Notification.countDocuments(), 1);
  const current = await Shortlet.findById(booking._id);
  assert.ok(["confirmed", "declined"].includes(current.status));
  await assert.rejects(reviewHostBooking(booking._id, "another-host", "confirmed"), e => e.status === 404);
});

test("real replica set: failed rejection transaction cannot release funds without recording the decision", async () => {
  const { rejectHostWithdrawal } = require("../src/services/review-host-withdrawal");
  const request = await seedReview(); const id = String(request._id);
  const create = Notification.create;
  Notification.create = async () => { throw new Error("Notification storage unavailable"); };
  try { await assert.rejects(rejectHostWithdrawal(id, "admin", "Declined")); } finally { Notification.create = create; }
  assert.equal(Number((await HostBalance.findOne()).available_balance), 900);
  assert.equal((await Withdrawal.findById(id)).status, "pending");
  assert.equal((await Withdrawal.findById(id)).funds_reserved, true);
});

test("HTTP: admin directory and profile responses never return password hashes", async () => {
  const admin = await Admin.create({ first_name: "Admin", last_name: "Person", email: "admin@example.test", password: "private-admin-hash" });
  const host = await Host.create({ first_name: "First", last_name: "Last", email: "host@example.test", password: "private-host-hash" });
  const user = await User.create({ first_name: "First", last_name: "Last", email: "user@example.test", password: "private-user-hash" });
  const owner = String(admin._id);
  await Session.create({ owner, key: "directory-admin", value: jwt.sign({ id: owner }, process.env.JWT_ADMIN_SECRET_KEY, { expiresIn: "1h" }) });
  const { createApp } = require("../server/createApp");
  const server = createApp().listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/v1/admin-app`;
  const headers = { "a-x-key": "directory-admin", "Content-Type": "application/json" };
  try {
    for (const [group, noun, id] of [["admin", "admin", admin._id], ["host", "host", host._id], ["user", "user", user._id]]) {
      for (const route of [`fetch-all-${noun}s`, `fetch-single-${noun}/${id}`]) {
        const response = await fetch(`${base}/${group}-management/${route}`, { headers });
        assert.equal(response.status, 200);
        const data = (await response.json()).data;
        for (const row of Array.isArray(data) ? data : [data]) assert.equal(row.password, undefined);
      }
      const updated = await fetch(`${base}/${group}-management/update-${noun}-profile/${id}`, {
        method: "PUT", headers, body: JSON.stringify({ phone: "123456789" }),
      });
      assert.equal(updated.status, 200);
      assert.equal((await updated.json()).data.password, undefined);
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test("HTTP: partner shortlet request cannot persist a client-selected cheap price", async () => {
  const APIToken = require("../src/models/app-core/APIToken");
  await APIToken.create({ firm: "partner", api_key: "partner-key", action_by: "test-admin" });
  const host = await Host.create({ first_name: "First", last_name: "Last", email: "host@example.test", password: "test-password" });
  const property = await Listing.create({ owner: host._id, apartment_name: "Example", country: "NG", state: "Lagos", lga: "Ikeja",
    address: "Example", email: "host@example.test", phone: "123456789", images: [{ url: "example" }], description: "Example", single: 1, single_price: "1000" });
  const { createApp } = require("../server/createApp");
  const server = createApp().listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/shortlet/book-shortlet-tp/${property._id}`, {
      method: "POST", headers: { firm: "partner", api_key: "partner-key", "Content-Type": "application/json" },
      body: JSON.stringify({ price: 1, check_in_date: "2099-12-12", check_out_date: "2099-12-14" }),
    });
    assert.equal(response.status, 409); assert.equal(await Shortlet.countDocuments(), 0);
    assert.equal(await Notification.countDocuments(), 0);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test("real replica set: auth attempt limits are atomic across callers and expire independently of TTL cleanup", async () => {
  const { consumeAuthAttempt } = require("../src/services/auth-rate-limit");
  const now = 1800000000000;
  const results = await Promise.allSettled(Array.from({ length: 20 }, () => consumeAuthAttempt("login", "ACCOUNT", 3, 900, now)));
  assert.equal(results.filter(result => result.status === "fulfilled").length, 3);
  assert.ok(results.filter(result => result.status === "rejected").every(result => result.reason.status === 429 && result.reason.retryAfter > 0));
  await assert.rejects(consumeAuthAttempt("login", "account", 3, 900, now), e => e.status === 429);
  await consumeAuthAttempt("login", "account", 3, 900, now + 900000);
  await consumeAuthAttempt("other-scope", "account", 3, 900, now);
  const rows = await RateBucket.find().lean();
  assert.equal(rows.length, 3);
  assert.ok(rows.every(row => !JSON.stringify(row).includes("account")));
});

test("HTTP: login throttles a resolved account and returns Retry-After", async () => {
  const { consumeAuthAttempt } = require("../src/services/auth-rate-limit");
  const user = await User.create({ first_name: "First", last_name: "Last", email: "rate@example.test", password: "not-used-by-blocked-request" });
  for (let i = 0; i < 10; i++) await consumeAuthAttempt("user-login", String(user._id), 10, 900);
  const { createApp } = require("../server/createApp");
  const server = createApp().listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/user-auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": "changed-client-header" },
      body: JSON.stringify({ loginId: "RATE@example.test", password: "wrong-password" }),
    });
    assert.equal(response.status, 429); assert.ok(Number(response.headers.get("retry-after")) > 0);
    assert.equal(await Session.countDocuments(), 0);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test("real replica set: a concurrent admin OTP verification has one winner; expired tokens are refused before TTL deletion", async () => {
  const controller = require("../src/controllers/admin/admin-auth-controller");
  const admin = await Admin.create({ first_name: "Admin", last_name: "Person", email: "admin@example.test", password: "test-password" });
  const token = await AdminLoginToken.create({ owner: admin._id, token: require("bcryptjs").hashSync("123456", 4) });
  const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json() { return this; } });
  let accepted = 0;
  await Promise.all(Array.from({ length: 2 }, () => controller.verifyLoginAttempt({ body: { userId: String(admin._id), otp: "123456" } }, response(), () => { accepted++; })));
  assert.equal(accepted, 1); assert.equal(await AdminLoginToken.countDocuments(), 0);
  await AdminLoginToken.collection.insertOne({ owner: admin._id, token: token.token, createdAt: new Date(Date.now() - 3601000) });
  await controller.verifyLoginAttempt({ body: { userId: String(admin._id), otp: "123456" } }, response(), () => { accepted++; });
  assert.equal(accepted, 1);
});
const withdrawalBank = { account_name: "Client Override", account_number: "1234567890", bank_data: { code: "123", name: "Client Override" } };

test("real replica set: invalid withdrawals and foreign bank accounts cannot change balances", async () => {
  const { requestHostWithdrawal } = require("../src/services/request-host-withdrawal");
  await seedWithdrawal();
  for (const amount of [-100, 0, NaN, Infinity, "100", {}, 0.001, 1.234, Number.MAX_SAFE_INTEGER]) {
    await assert.rejects(requestHostWithdrawal("host", amount, withdrawalBank), e => e.status === 400);
  }
  await BankAccount.updateOne({ owner: "host" }, { $set: { owner: "other-host" } });
  await assert.rejects(requestHostWithdrawal("host", 100, withdrawalBank), e => e.status === 404);
  assert.equal(Number((await HostBalance.findOne()).available_balance), 1000);
  assert.equal(await Withdrawal.countDocuments(), 0);
});

test("real replica set: competing withdrawals cannot overspend and bank details come from storage", async () => {
  const { requestHostWithdrawal } = require("../src/services/request-host-withdrawal");
  await seedWithdrawal();
  const results = await Promise.allSettled([
    requestHostWithdrawal("host", 700, withdrawalBank), requestHostWithdrawal("host", 700, withdrawalBank),
  ]);
  assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
  assert.equal(results.find(r => r.status === "rejected").reason.status, 409);
  assert.equal(Number((await HostBalance.findOne()).available_balance), 300);
  assert.equal(await Withdrawal.countDocuments(), 1);
  const saved = await Withdrawal.findOne();
  assert.equal(saved.bank_details.account_name, "Saved Name");
  assert.equal(saved.bank_details.bank_data.name, "Saved Bank");
});

test("real replica set: withdrawal record failure rolls back the balance debit", async () => {
  const { requestHostWithdrawal } = require("../src/services/request-host-withdrawal");
  await seedWithdrawal();
  const create = Withdrawal.create;
  Withdrawal.create = async () => { throw new Error("Withdrawal storage unavailable"); };
  try { await assert.rejects(requestHostWithdrawal("host", 100, withdrawalBank)); } finally { Withdrawal.create = create; }
  assert.equal(Number((await HostBalance.findOne()).available_balance), 1000);
  assert.equal(await Withdrawal.countDocuments(), 0);
});

test("HTTP: signed Paystack notification records once; unsigned or modified payloads are denied", async () => {
  await seedFlight();
  const server = require("../server/createApp").createApp().listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/v1/website/paystack-webhook`;
  const body = JSON.stringify({ event: "charge.success", data: { reference: "payment-1", metadata: { booking_reference: "TW-example" } } });
  const signature = require("node:crypto").createHmac("sha512", "test-secret").update(body).digest("hex");
  const headers = { "Content-Type": "application/json", "x-paystack-signature": signature };
  try {
    const denied = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body });
    assert.equal(denied.status, 401); await denied.text();
    const tampered = await fetch(url, { method: "POST", headers, body: body + " " });
    assert.equal(tampered.status, 401); await tampered.text();
    for (let i = 0; i < 2; i++) {
      const accepted = await fetch(url, { method: "POST", headers, body });
      assert.equal(accepted.status, 200); await accepted.text();
    }
    assert.equal(await Payment.countDocuments(), 1); assert.equal(await Receipt.countDocuments(), 1);
    assert.equal((await Flight.findOne()).payment_status, "paid");
  } finally { await new Promise(resolve => server.close(resolve)); }
});
