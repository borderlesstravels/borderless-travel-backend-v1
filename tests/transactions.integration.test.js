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
const { recordPayment } = require("../src/services/record-payment");
let repl, originalGet, originalSender, providerCalls;
const flightData = (ref = "TW-example") => ({ owner: "owner@example.test", firm: "site", api_key: "test-public",
  contact_details: { c_first_name: "First", c_last_name: "Last", c_email: "owner@example.test", c_relationship_to_p: "self" },
  passenger_details: [{ first_name: "First" }], contact_relationship: "self", airline: "Example", airline_logo: "example-logo",
  departure_time: new Date("2026-12-12"), arrival_time: new Date("2026-12-13"), origin_code: "LOS", destination_code: "LHR",
  origin: "LOS", destination: "LHR", price: 1000, status: "booked", booking_reference: ref });

test.before(async () => {
  // Ephemeral loopback-only replica set. Never connects to DB_URI/production.
  repl = await MongoMemoryReplSet.create({ binary: { version: "7.0.14" }, replSet: { count: 1, storageEngine: "wiredTiger" } });
  await mongoose.connect(repl.getUri(), { dbName: "security-regression" });
  await Promise.all([Flight, Shortlet, Payment, Receipt, Sale, Markup, HostBalance, HostEarning, Attempt, User, Session].map(model => model.init()));
  process.env.PAYSTACK_SECRET = "test-secret";
  process.env.JWT_USER_SECRET_KEY = "test-session-secret";
  originalGet = axios.get;
  axios.get = async url => ({ data: { status: true, data: { status: "success", reference: url.split("/").at(-1),
    amount: 100000, currency: "NGN", customer: { email: "owner@example.test" },
    metadata: { booking_reference: "TW-example" }, paid_at: "2026-11-07T10:00:00Z" } } });
  const sender = require("../src/api/sender"); originalSender = sender.sender_tiqwa;
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
