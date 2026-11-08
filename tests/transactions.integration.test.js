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
  await Promise.all([Flight, Shortlet, Payment, Receipt, Sale, Markup, HostBalance, HostEarning, Attempt, User, Session, Host, Notification, BankAccount, Withdrawal].map(model => model.init()));
  process.env.PAYSTACK_SECRET = "test-secret";
  process.env.JWT_USER_SECRET_KEY = "test-session-secret";
  process.env.JWT_HOST_SECRET_KEY = "test-host-session-secret";
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
  await mongoose.disconnect(); if (repl) await repl.stop();
});
test.beforeEach(async () => {
  providerCalls = 0;
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
