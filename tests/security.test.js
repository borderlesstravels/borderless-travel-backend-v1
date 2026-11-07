const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function load(relative, mocks = {}) {
  const filename = path.join(__dirname, "..", relative);
  const module = { exports: {} };
  const source = fs.readFileSync(filename, "utf8");
  vm.runInNewContext(`(function(require,module,exports,process,console){${source}\n})`, { Buffer, Date, URL, Promise, setTimeout })(
    (name) => Object.hasOwn(mocks, name) ? mocks[name] : require(require.resolve(name, { paths: [path.dirname(filename)] })),
    module, module.exports, { env: { PAYSTACK_SECRET: "test-secret", JWT_USER_SECRET_KEY: "test-session-secret" } }, { log() {}, error() {} },
  );
  return module.exports;
}

const integrity = load("src/services/payment-integrity.js", { axios: {} });
const booking = { price: 1000, currency: "NGN", booking_reference: "TW-example", contact_details: { c_email: "owner@example.test" } };
const good = () => ({ status: "success", reference: "payment-1", amount: 100000, currency: "NGN",
  metadata: { booking_reference: "TW-example" }, customer: { email: "owner@example.test" }, paid_at: "2026-11-07T10:00:00Z" });

test("verified payment accepts exact booking amount, currency, metadata and payer", () => {
  assert.equal(integrity.validateTransaction(good(), booking, "payment-1").amount, 100000);
});
for (const [label, change] of [
  ["unsuccessful payment", { status: "pending" }],
  ["different transaction", { reference: "other" }],
  ["underpayment", { amount: 99999 }],
  ["overpayment", { amount: 100001 }],
  ["string amount", { amount: "100000" }],
  ["different currency", { currency: "USD" }],
  ["another booking", { metadata: { booking_reference: "TW-other" } }],
  ["missing booking binding", { metadata: {} }],
  ["invalid metadata JSON", { metadata: "{" }],
  ["different payer", { customer: { email: "other@example.test" } }],
  ["missing settlement time", { paid_at: null }],
]) test(`rejects ${label}`, () => {
  assert.throws(() => integrity.validateTransaction({ ...good(), ...change }, booking, "payment-1"));
});
test("accepts provider JSON metadata and case-insensitive email", () => {
  const t = good(); t.metadata = JSON.stringify(t.metadata); t.customer.email = "OWNER@example.test";
  assert.doesNotThrow(() => integrity.validateTransaction(t, booking, "payment-1"));
});
test("invalid stored prices fail closed", () => {
  for (const price of [0, -1, NaN, Infinity, "bad", Number.MAX_SAFE_INTEGER]) assert.throws(() => integrity.minorUnits(price));
});
test("Paystack verification uses fixed origin, bearer auth, timeout and no redirects", async () => {
  let call;
  const api = load("src/services/payment-integrity.js", { axios: { get: async (...args) => {
    call = args; return { data: { status: true, data: good() } };
  } } });
  await api.verifyPaystack("payment-1");
  assert.equal(call[0], "https://api.paystack.co/transaction/verify/payment-1");
  assert.equal(call[1].timeout, 15000);
  assert.equal(call[1].maxRedirects, 0);
  assert.equal(call[1].headers.Authorization, "Bearer test-secret");
  await assert.rejects(api.verifyPaystack("../../elsewhere"));
});
test("provider outages expose no upstream data and never imply payment", async () => {
  const api = load("src/services/payment-integrity.js", { axios: { get: async () => { throw new Error("secret upstream details"); } } });
  await assert.rejects(api.verifyPaystack("payment-1"), (error) => error.status === 502 && !error.message.includes("secret"));
});

const query = (value) => ({ select() { return this; }, session() { return Promise.resolve(value); }, then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); } });
function response() {
  return { statusCode: 200, headers: {}, status(code) { this.statusCode = code; return this; },
    set(k, v) { this.headers[k] = v; return this; }, json(body) { this.body = body; return this; } };
}
function profile(overrides) {
  const blank = new Proxy({}, { get: () => () => {} });
  const mocks = new Proxy(overrides, { get: (obj, key) => key in obj ? obj[key] : blank, getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true, value: undefined }) });
  // Explicit dependencies keep this controller test independent of database/provider access.
  return load("src/controllers/user/user-profile-controller.js", Object.fromEntries([
    "../../models/user/User", "../../models/user/UserReferral", "../../models/general/FlightBooking",
    "../../models/general/ShortletBooking", "../../models/general/Review", "../../models/general/Notification",
    "../../models/host/ShortLet", "../../models/general/Payment", "bcryptjs", "../../middlewares/general",
  ].map(name => [name, mocks[name]]).concat([["../../utils/helpers", {
    sendError: (res, error, status = 401) => res.status(status).json({ success: false, error }),
    sendSuccess: (res, message, data) => res.json({ success: true, data }),
  }]])));
}
for (const [method, model] of [["userSingleFlightBooking", "FlightBooking"], ["userSingleShortletBooking", "ShortletBooking"]]) {
  test(`${method} scopes lookup to signed-in owner and hides missing/foreign booking`, async () => {
    let filter;
    const c = profile({ "../../models/user/User": { findById: () => query({ email: "owner@example.test" }) },
      [`../../models/general/${model}`]: { findOne: (input) => { filter = input; return query(null); } } });
    const res = response(); await c[method]({ id: "user-1", params: { id: "booking-2" } }, res);
    assert.equal(filter.owner, "owner@example.test"); assert.equal(filter._id, "booking-2"); assert.equal(res.statusCode, 404);
  });
}
test("profile update cannot overwrite password, email or verification status", async () => {
  let update;
  const c = profile({ "../../models/user/User": { findByIdAndUpdate: (id, input) => { update = input; return query({}); } } });
  await c.updateUserProfile({ id: "owner", body: { first_name: "First", last_name: "Last", username: "owner", phone: "123", email: "victim@example.test", password: "changed", email_verified: true } }, response());
  assert.deepEqual(Object.keys(update.$set).sort(), ["first_name", "last_name", "phone", "username"]);
});

function paymentFixture({ existing = null, failSave = false } = {}) {
  let writes = [], committed = [], ended = false;
  const current = { ...booking, owner: "owner@example.test", firm: "site", payment_status: "pending",
    save: async () => { if (failSave) throw new Error("database failed"); writes.push("booking"); } };
  const session = { endSession: async () => { ended = true; }, withTransaction: async fn => {
    try { await fn(); committed = [...writes]; } catch (error) { writes = []; throw error; }
  } };
  const noopModel = {};
  const service = load("src/services/record-payment.js", {
    mongoose: { startSession: async () => session },
    "./payment-integrity": { ...integrity, verifyPaystack: async () => good() },
    "../models/general/FlightBooking": { findOne: () => query(current) },
    "../models/general/ShortletBooking": noopModel,
    "../models/general/Payment": { findOne: () => query(existing), create: async (data, options) => { assert.equal(options.session, session); writes.push("payment"); } },
    "../models/general/PaymentReceipt": { create: async (data, options) => { assert.equal(options.session, session); writes.push("receipt"); } },
    "../models/general/Markup": noopModel,
    "../models/app-core/Markup": { findOne: () => query({ commission: 10 }) },
    "../models/general/SaleRecord": { findOne: () => query({ profit: 100, save: async ({ session: s }) => { assert.equal(s, session); writes.push("sale"); } }) },
    "../models/host/HostBalance": noopModel, "../models/host/HostEarning": noopModel,
  });
  return { service, current, get committed() { return committed; }, get ended() { return ended; } };
}
const paymentInput = { service: "flight", firm: "site", bookingReference: "TW-example", transactionReference: "payment-1" };
test("payment, receipt, booking and sale writes share a single transaction", async () => {
  const f = paymentFixture(); await f.service.recordPayment(paymentInput);
  assert.deepEqual(f.committed, ["receipt", "payment", "sale", "booking"]); assert.equal(f.ended, true);
});
test("database failure cannot partially commit payment state", async () => {
  const f = paymentFixture({ failSave: true });
  await assert.rejects(f.service.recordPayment(paymentInput)); assert.deepEqual(f.committed, []); assert.equal(f.ended, true);
});
test("a payment reference already used on another booking is rejected without writes", async () => {
  const f = paymentFixture({ existing: { booking_reference: "other", service_name: "flight" } });
  await assert.rejects(f.service.recordPayment(paymentInput), e => e.status === 409); assert.deepEqual(f.committed, []);
});
test("same-payment retry succeeds without duplicate ledger writes", async () => {
  const f = paymentFixture({ existing: { booking_reference: "TW-example", service_name: "flight" } });
  f.current.payment_status = "paid";
  const result = await f.service.recordPayment(paymentInput);
  assert.equal(result.replay, true); assert.deepEqual(f.committed, []);
});

const jwt = require("jsonwebtoken");
function access() {
  return load("src/services/booking-access.js", {
    "../models/general/FlightBooking": {}, "../models/user/User": {},
    "../middlewares/general": { getSessionToken: async () => null, verifyLoginSession: async () => false },
  });
}
test("receipt grants access only to its exact booking", async () => {
  const service = access(); const token = service.issueBookingAccess(booking);
  assert.equal(await service.canReadBooking({ headers: { authorization: `Bearer ${token}` } }, booking), true);
  assert.equal(await service.canReadBooking({ headers: { authorization: `Bearer ${token}` } }, { booking_reference: "other" }), false);
});
test("expired, wrong-audience, unsigned, and tampered receipts are refused", async () => {
  const service = access();
  for (const token of [
    jwt.sign({ booking_reference: booking.booking_reference }, "test-session-secret", { audience: "other", expiresIn: "1h" }),
    jwt.sign({ booking_reference: booking.booking_reference }, "test-session-secret", { audience: "borderless-booking-receipt", expiresIn: -1 }),
    jwt.sign({ booking_reference: booking.booking_reference }, "", { algorithm: "none" }),
    service.issueBookingAccess(booking) + "tampered",
  ]) assert.equal(await service.canReadBooking({ headers: { authorization: `Bearer ${token}` } }, booking), false);
  assert.equal(await service.canReadBooking({ headers: {} }, booking), false);
});

function webhook(provider) {
  const updates = [];
  const helpers = { verifyAPIToken: async () => true,
    sendError: (res, error, status = 401) => res.status(status).json({ error }),
    sendSuccess: (res, message) => res.json({ success: true, message }) };
  const controller = load("src/controllers/website/flight-controller.js", {
    bcryptjs: {}, "../../api/fetcher": { fetcher_tiqwa: async () => provider },
    "../../api/sender": {}, "../../models/general/FlightBooking": {
      findOne: async () => ({ _id: "booking-1" }),
      updateOne: async (...args) => { updates.push(args); },
    }, "../../models/user/User": {}, "../../models/app-core/APIToken": {},
    "../../models/general/BookingRequest": {}, "../../models/general/SaleRecord": {},
    "../../services/booking-access": {}, "../../utils/helpers": helpers,
  });
  return { controller, updates };
}
test("forged issued callback cannot set issued when provider says booked", async () => {
  const f = webhook({ status: 200, data: { reference: "TW-example", status: "booked" } });
  await f.controller.flightProviderWebHook({ body: { event: "ticket.issued", data: { reference: "TW-example", status: "issued" } } }, response());
  assert.equal(f.updates[0][1].$set.status, "booked");
  assert.equal(f.updates[0][0].status.$in.includes("issued"), false);
  assert.equal(f.updates[0][0].status.$in.includes("cancelled"), false);
});
test("provider failure and mismatched reference cannot mutate booking status", async () => {
  for (const provider of [undefined, { status: 401 }, { status: 200, data: { reference: "other", status: "issued" } }]) {
    const f = webhook(provider); const res = response();
    await f.controller.flightProviderWebHook({ body: { event: "ticket.issued", data: { reference: "TW-example" } } }, res);
    assert.equal(res.statusCode, 502); assert.equal(f.updates.length, 0);
  }
});
test("unknown events and non-string references do not trigger status updates", async () => {
  const f = webhook({ status: 200 });
  await f.controller.flightProviderWebHook({ body: { event: "unknown", data: {} } }, response());
  const res = response();
  await f.controller.flightProviderWebHook({ body: { event: "ticket.issued", data: { reference: { $ne: null } } } }, res);
  assert.equal(res.statusCode, 400); assert.equal(f.updates.length, 0);
});
test("Express 4 async route rejection reaches error middleware", async () => {
  const { forwardAsyncErrors } = require("../server/async-routes");
  const failure = new Error("async failure"); let received;
  const router = { stack: [{ route: { stack: [{ handle: async () => { throw failure; } }] } }] };
  forwardAsyncErrors(router);
  await router.stack[0].route.stack[0].handle({}, {}, error => { received = error; });
  assert.equal(received, failure);
});

const crypto = require("node:crypto");
const { verifyPaystackSignature } = require("../src/services/webhook-signatures");
test("Paystack legacy signature is validated against exact raw bytes", () => {
  const raw = Buffer.from('{"event":"charge.success"}');
  const signature = crypto.createHmac("sha512", "secret").update(raw).digest("hex");
  assert.equal(verifyPaystackSignature(raw, { "x-paystack-signature": signature }, { PAYSTACK_SECRET: "secret" }), true);
  assert.equal(verifyPaystackSignature(Buffer.concat([raw, Buffer.from(" ")]), { "x-paystack-signature": signature }, { PAYSTACK_SECRET: "secret" }), false);
  assert.equal(verifyPaystackSignature(raw, { "x-paystack-signature": "bad" }, { PAYSTACK_SECRET: "secret" }), false);
  assert.equal(verifyPaystackSignature(raw, {}, {}), false);
});
test("Paystack modern signatures enforce timestamp, rotation, and prevent legacy downgrade", () => {
  const raw = Buffer.from('{"event":"charge.success"}'), time = 1800000000;
  const sign = secret => crypto.createHmac("sha512", secret).update(`${time}.`).update(raw).digest("hex");
  const headers = { "paystack-signature": `t=${time},v1=whk_new:${sign("new")},v1=whk_old:${sign("old")}` };
  assert.equal(verifyPaystackSignature(raw, headers, { PAYSTACK_WEBHOOK_SECRET: "new" }, time), true);
  assert.equal(verifyPaystackSignature(raw, headers, { PAYSTACK_WEBHOOK_SECRET: "future", PAYSTACK_WEBHOOK_PREVIOUS_SECRET: "old" }, time), true);
  assert.equal(verifyPaystackSignature(raw, headers, { PAYSTACK_WEBHOOK_SECRET: "new" }, time + 301), false);
  assert.equal(verifyPaystackSignature(raw, headers, { PAYSTACK_WEBHOOK_SECRET: "new" }, time - 301), false);
  assert.equal(verifyPaystackSignature(raw, { "paystack-signature": headers["paystack-signature"] + `,t=${time}` }, { PAYSTACK_WEBHOOK_SECRET: "new" }, time), false);
  const legacy = crypto.createHmac("sha512", "legacy").update(raw).digest("hex");
  assert.equal(verifyPaystackSignature(raw, { "x-paystack-signature": legacy }, { PAYSTACK_WEBHOOK_SECRET: "new", PAYSTACK_SECRET: "legacy" }, time), false);
});
