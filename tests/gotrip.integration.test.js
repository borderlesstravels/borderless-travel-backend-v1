const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Intent = require("../src/models/general/CreditIntent");
const Event = require("../src/models/general/CreditEvent");
const Link = require("../src/models/general/CreditLink");
const Session = require("../src/models/general/SessionStore");
const User = require("../src/models/user/User");
const Admin = require("../src/models/admin/Admin");
const Funding = require("../src/models/general/CreditFundingReview");
const ReviewNote = require("../src/models/general/CreditReviewNote");
const Fare = require("../src/models/general/CreditFareReview");
const gateway = require("../src/api/fetcher");
const originalGateway = gateway.fetcher_tiqwa;
let quoteAmount, quoteStatus, quoteCalls;
let database, server, base, owner;
const context = { flightId: "test-offer", origin: "LOS", destination: "ABV" };
test.before(async () => {
  // Never reads DB_URI or connects to production. Dedicated ephemeral loopback DB.
  database = await MongoMemoryServer.create({ binary: { version: "7.0.14" } });
  await mongoose.connect(database.getUri(), { dbName: "gotrip-local-test" });
  await Promise.all(
    [Intent, Event, Link, Session, User, Admin, Funding, Fare, ReviewNote].map(
      (model) => model.init(),
    ),
  );
  process.env.GOTRIP_ENABLED = "true";
  process.env.GOTRIP_WEBHOOK_SECRET = "local-webhook-secret";
  process.env.JWT_USER_SECRET_KEY = "local-user-secret";
  process.env.JWT_ADMIN_SECRET_KEY = "local-admin-secret";
  const { createApp } = require("../server/createApp");
  server = createApp().listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}/api/v1/credit`;
});
test.after(async () => {
  gateway.fetcher_tiqwa = originalGateway;
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  if (database) await database.stop();
});
test.beforeEach(async () => {
  process.env.GOTRIP_ENABLED = "true";
  await Promise.all(
    [Intent, Event, Link, Session, User, Admin, Funding, Fare, ReviewNote].map(
      (model) => model.deleteMany({}),
    ),
  );
  quoteAmount = "10000.50";
  quoteStatus = 200;
  quoteCalls = 0;
  gateway.fetcher_tiqwa = async () => {
    quoteCalls++;
    return {
      status: quoteStatus,
      data: { id: "test-offer", currency: "NGN", amount: quoteAmount },
    };
  };
  const user = await User.create({
    first_name: "Review",
    last_name: "Customer",
    email: "review@example.test",
    password: "test-password",
  });
  owner = user.id;
  const admin = await Admin.create({
    first_name: "Review",
    last_name: "Admin",
    email: "staff@example.test",
    password: "test-password",
    email_verified: true,
  });
  await Session.create([
    {
      owner,
      key: "user",
      value: jwt.sign({ id: owner }, process.env.JWT_USER_SECRET_KEY, {
        expiresIn: "1h",
      }),
    },
    {
      owner: admin.id,
      key: "admin",
      value: jwt.sign(
        { id: admin.id, auth_version: 0 },
        process.env.JWT_ADMIN_SECRET_KEY,
        { expiresIn: "1h" },
      ),
    },
  ]);
});
async function approvedSelection() {
  const id = (await (await save()).json()).data.id;
  await deliver(
    {
      ...payload("loan.approved"),
      data: {
        loan: {
          reference: "LN1",
          status: "approved",
          currency: "NGN",
          loan_amount: 10000.5,
          amount_disbursed: 10000.5,
        },
      },
    },
    "LN1:loan.approved",
  );
  await post(
    "/review/link",
    {
      intentId: id,
      loanReference: "LN1",
      reason: "Verified customer identity for sample transfer",
    },
    { "a-x-key": "admin" },
  );
  return id;
}
const fundingInput = (intentId) => ({
  intentId,
  bankReference: "BANK-SAMPLE-001",
  amountNaira: "10000.50",
  currency: "NGN",
  receivedAt: "2026-11-12T12:00:00Z",
  bankReceiptChecked: true,
  reason: "Matched confirmed bank credit against provider reference",
});
test("same supplied approval payload supports bank review without narration or an extra webhook", async () => {
  const id = await approvedSelection();
  const body = fundingInput(id);
  assert.equal(
    (await post("/review/funding", body, { "u-x-key": "user" })).status,
    401,
  );
  const response = await post("/review/funding", body, { "a-x-key": "admin" });
  assert.equal(response.status, 201);
  assert.equal(
    (await post("/review/funding", body, { "a-x-key": "admin" })).status,
    201,
  );
  const record = await Funding.findOne().lean();
  assert.equal(record.amountMinor, "1000050");
  assert.equal(record.providerReference, "LN1");
  assert.ok(record.reviewedBy);
  assert.equal(await Funding.countDocuments(), 1);
  assert.equal(record.narration, undefined);
  assert.equal(
    (
      await post(
        "/review/funding",
        { ...body, bankReference: "OTHER" },
        { "a-x-key": "admin" },
      )
    ).status,
    409,
  );
  const list = await (
    await fetch(base + "/intents", { headers: { "u-x-key": "user" } })
  ).json();
  assert.equal(list.data[0].fundingStatus, "bank_review_recorded");
  assert.equal(list.data[0].ticketingEnabled, false);
  assert.ok(!JSON.stringify(list).includes("BANK-SAMPLE"));
});
test("bank review refuses missing acknowledgment, wrong amounts, currency and unmatched selection", async () => {
  const id = await approvedSelection();
  const body = fundingInput(id);
  for (const [change, status] of [
    [{ bankReceiptChecked: false }, 400],
    [{ amountNaira: "7000.35" }, 409],
    [{ amountNaira: "10001.50" }, 409],
    [{ currency: "USD" }, 400],
    [{ amountNaira: "10000.501" }, 400],
  ])
    assert.equal(
      (
        await post(
          "/review/funding",
          { ...body, ...change },
          { "a-x-key": "admin" },
        )
      ).status,
      status,
    );
  assert.equal(await Funding.countDocuments(), 0);
});
test("Tiqwa preflight is read only, compares exact funds and rejects expired or unavailable offers", async () => {
  const id = await approvedSelection();
  assert.equal(
    (
      await post(
        "/review/recheck-fare",
        { intentId: id },
        { "a-x-key": "admin" },
      )
    ).status,
    409,
  );
  assert.equal(quoteCalls, 0);
  await post("/review/funding", fundingInput(id), { "a-x-key": "admin" });
  assert.equal(
    (
      await post(
        "/review/recheck-fare",
        { intentId: id },
        { "u-x-key": "user" },
      )
    ).status,
    401,
  );
  const recheck = () =>
    post("/review/recheck-fare", { intentId: id }, { "a-x-key": "admin" });
  assert.equal((await (await recheck()).json()).data.outcome, "matched");
  quoteAmount = "10000.51";
  assert.equal((await (await recheck()).json()).data.outcome, "shortfall");
  quoteAmount = "10000.49";
  assert.equal((await (await recheck()).json()).data.outcome, "surplus");
  await Fare.updateMany({}, { $set: { expiresAt: new Date(0) } });
  const expired = await (
    await fetch(base + "/intents", { headers: { "u-x-key": "user" } })
  ).json();
  assert.equal(expired.data[0].fareReviewStatus, "expired");
  quoteStatus = 404;
  assert.equal((await recheck()).status, 503);
  const unavailable = await (
    await fetch(base + "/intents", { headers: { "u-x-key": "user" } })
  ).json();
  assert.equal(unavailable.data[0].fareReviewStatus, "unavailable");
  assert.equal(
    await mongoose.connection.collection("payments").countDocuments(),
    0,
  );
  assert.equal(
    await mongoose.connection.collection("flightbookings").countDocuments(),
    0,
  );
});
test("a bank transaction cannot be allocated to two different customer selections", async () => {
  const first = await approvedSelection();
  await post("/review/funding", fundingInput(first), { "a-x-key": "admin" });
  const second = (await (await save("second-selection")).json()).data.id;
  await deliver(
    {
      ...payload("loan.approved"),
      reference: "LN2",
      data: {
        loan: {
          reference: "LN2",
          status: "approved",
          currency: "NGN",
          loan_amount: "10000.50",
          amount_disbursed: "10000.50",
        },
      },
    },
    "LN2:loan.approved",
  );
  await post(
    "/review/link",
    {
      intentId: second,
      loanReference: "LN2",
      reason: "Verified second application identity",
    },
    { "a-x-key": "admin" },
  );
  assert.equal(
    (
      await post("/review/funding", fundingInput(second), {
        "a-x-key": "admin",
      })
    ).status,
    409,
  );
  assert.equal(await Funding.countDocuments(), 1);
});
const post = (path, body, headers = {}) =>
  fetch(base + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
const payload = (event = "loan.created") => ({
  event,
  reference: "LN1",
  occurred_at: "2026-11-11T10:00:00Z",
  data: { customer: { email: "review@example.test" } },
});
async function deliver(
  body,
  key = "LN1:loan.created",
  raw = JSON.stringify(body),
) {
  const timestamp = Math.floor(Date.now() / 1000),
    signature = crypto
      .createHmac("sha256", process.env.GOTRIP_WEBHOOK_SECRET)
      .update(`${timestamp}.`)
      .update(raw)
      .digest("hex");
  return fetch(base + "/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-idempotency-key": key,
      "x-lendsqr-signature": `t=${timestamp},v1=${signature}`,
    },
    body: raw,
  });
}
async function save(key = "selection-1") {
  return post("/intents", context, {
    "u-x-key": "user",
    "x-idempotency-key": key,
  });
}
test("disabled feature and unsigned webhook fail closed", async () => {
  process.env.GOTRIP_ENABLED = "false";
  assert.equal((await save()).status, 503);
  process.env.GOTRIP_ENABLED = "true";
  assert.equal((await post("/webhook", payload())).status, 401);
  assert.equal(await Event.countDocuments(), 0);
});
test("signed concurrent deliveries persist once, exact retry succeeds, conflicting payload is rejected", async () => {
  const responses = await Promise.all(
    Array.from({ length: 5 }, () => deliver(payload())),
  );
  assert.ok(responses.every((item) => [200, 202].includes(item.status)));
  assert.equal(await Event.countDocuments(), 1);
  assert.equal(
    (await deliver({ ...payload(), data: { changed: true } })).status,
    409,
  );
});
test("malformed and oversized webhook requests are rejected", async () => {
  assert.equal((await deliver(null, "key", "{")).status, 400);
  assert.equal(
    (
      await deliver(
        payload(),
        "key",
        JSON.stringify({ padding: "a".repeat(270000) }),
      )
    ).status,
    413,
  );
  assert.equal(await Event.countDocuments(), 0);
});
test("persistence failure never acknowledges success", async () => {
  const create = Event.create;
  Event.create = async () => {
    throw new Error("local injected storage failure");
  };
  try {
    assert.equal((await deliver(payload())).status, 503);
  } finally {
    Event.create = create;
  }
});
test("customer intents are authenticated, owner scoped and idempotent", async () => {
  assert.equal(
    (await post("/intents", context, { "x-idempotency-key": "key" })).status,
    401,
  );
  const first = await (await save()).json(),
    second = await (await save()).json();
  assert.equal(first.data.id, second.data.id);
  assert.equal(await Intent.countDocuments(), 1);
  assert.equal(
    (
      await post(
        "/intents",
        { ...context, flightId: "different" },
        { "u-x-key": "user", "x-idempotency-key": "selection-1" },
      )
    ).status,
    409,
  );
  await Intent.create({
    owner: new mongoose.Types.ObjectId(),
    requestKey: "foreign",
    contextHash: "hash",
    flightId: "private-flight",
  });
  const list = await (
    await fetch(base + "/intents", { headers: { "u-x-key": "user" } })
  ).json();
  assert.equal(list.data.length, 1);
  assert.equal(list.data[0].fundingStatus, "not_verified");
});
test("only admin may link identities; linking never confirms funding and cannot be overwritten", async () => {
  const intent = (await (await save()).json()).data.id;
  await deliver(payload("loan.approved"), "LN1:loan.approved");
  const body = {
    intentId: intent,
    loanReference: "LN1",
    reason: "Verified customer identity against application",
  };
  assert.equal(
    (await post("/review/link", body, { "u-x-key": "user" })).status,
    401,
  );
  assert.equal(
    (await fetch(base + "/review", { headers: { "u-x-key": "user" } })).status,
    401,
  );
  assert.equal(
    (await post("/review/link", body, { "a-x-key": "admin" })).status,
    201,
  );
  assert.equal(
    (await post("/review/link", body, { "a-x-key": "admin" })).status,
    409,
  );
  const [item] = (
    await (
      await fetch(base + "/intents", { headers: { "u-x-key": "user" } })
    ).json()
  ).data;
  assert.equal(item.status, "approved_awaiting_funding");
  assert.equal(item.fundingStatus, "not_verified");
  assert.equal(item.ticketStatus, "not_issued");
  assert.equal(
    await mongoose.connection.collection("payments").countDocuments(),
    0,
  );
  assert.equal(
    await mongoose.connection.collection("flightbookings").countDocuments(),
    0,
  );
  const link = await Link.findOne();
  assert.ok(link.reviewedBy);
  assert.equal(link.reason, body.reason);
});
test("repayment data is minimized and retained for staff review without application/payment transition", async () => {
  const body = {
    ...payload("loan.repayment"),
    data: {
      user: { email: "review@example.test" },
      loan: { amount_disbursed: 50000 },
      form_data: { passport: "never store" },
      repayment: { reference: "private" },
    },
  };
  assert.equal((await deliver(body, "LN1:loan.repayment")).status, 202);
  const stored = await Event.findOne().lean();
  assert.equal(stored.disposition, "review_required");
  assert.equal(stored.data, undefined);
  assert.equal(stored.form_data, undefined);
});
test("blocked and deleted customer accounts cannot use a surviving session", async () => {
  await User.findByIdAndUpdate(owner, { status: "Blocked" });
  assert.equal((await save()).status, 403);
  assert.equal(
    (await fetch(base + "/intents", { headers: { "u-x-key": "user" } })).status,
    403,
  );
  await User.findByIdAndDelete(owner);
  assert.equal((await save()).status, 403);
  assert.equal(await Intent.countDocuments(), 0);
});
test("nested approval, owner-scoped resume and timeline never expose provider contacts or imply funding", async () => {
  const intent = (await (await save()).json()).data.id;
  const approval = {
    ...payload("loan.approved"),
    data: {
      loan: {
        reference: "LN1",
        status: "approved",
        currency: "NGN",
        loan_amount: 50000,
        amount_disbursed: 50000,
      },
      user: { email: "private-provider@example.test" },
      form_data: { secret: "private" },
    },
  };
  assert.equal((await deliver(approval, "LN1:loan.approved")).status, 202);
  await post(
    "/review/link",
    {
      intentId: intent,
      loanReference: "LN1",
      reason: "Verified customer against loan reference",
    },
    { "a-x-key": "admin" },
  );
  const own = await (
    await fetch(base + "/intents?flightId=test-offer", {
      headers: { "u-x-key": "user" },
    })
  ).json();
  assert.equal(own.data.length, 1);
  assert.equal(own.data[0].history[0].event, "loan.approved");
  assert.equal(own.data[0].loanReference, "LN1");
  assert.equal(own.data[0].fundingStatus, "not_verified");
  assert.equal(own.data[0].ticketStatus, "not_issued");
  assert.ok(!JSON.stringify(own).includes("private-provider"));
  assert.ok(!JSON.stringify(own).includes("form_data"));
  const absent = await (
    await fetch(base + "/intents?flightId=foreign", {
      headers: { "u-x-key": "user" },
    })
  ).json();
  assert.equal(absent.data.length, 0);
  const review = await (
    await fetch(base + "/review?loanReference=LN1", {
      headers: { "a-x-key": "admin" },
    })
  ).json();
  assert.equal(review.data.events[0].reportedDisbursedMinor, "5000000");
  assert.equal(review.data.intents[0].customer.email, "review@example.test");
  assert.ok(!JSON.stringify(review).includes("password"));
});
test("a webhook write finishing after the response deadline is recovered by an idempotent retry", async () => {
  const create = Event.create;
  let finish;
  Event.create = (...args) =>
    new Promise((resolve, reject) => {
      finish = () => create.apply(Event, args).then(resolve, reject);
    });
  try {
    assert.equal((await deliver(payload())).status, 503);
    await finish();
  } finally {
    Event.create = create;
  }
  assert.equal((await deliver(payload())).status, 200);
  assert.equal(await Event.countDocuments(), 1);
});

test("staff review notes require admin identity and do not establish funding", async () => {
  const id = (await (await save()).json()).data.id;
  const body = {
    intentId: id,
    category: "customer_contact",
    reason: "Contacted customer to confirm the selected flight",
  };
  assert.equal(
    (await post("/review/notes", body, { "u-x-key": "user" })).status,
    401,
  );
  assert.equal(
    (
      await post(
        "/review/notes",
        { ...body, reason: "short" },
        { "a-x-key": "admin" },
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await post(
        "/review/notes",
        { ...body, intentId: new mongoose.Types.ObjectId().toString() },
        { "a-x-key": "admin" },
      )
    ).status,
    404,
  );
  assert.equal(
    (await post("/review/notes", body, { "a-x-key": "admin" })).status,
    201,
  );
  const response = await fetch(base + "/review", {
    headers: { "a-x-key": "admin" },
  });
  const data = (await response.json()).data;
  assert.equal(data.notes.length, 1);
  assert.equal(data.notes[0].reason, body.reason);
  assert.ok(data.notes[0].actionBy);
  assert.equal(await Funding.countDocuments(), 0);
  assert.equal(await Link.countDocuments(), 0);
});
test("staff queue paginates and exact reference retrieves an older matched selection", async () => {
  const docs = await Intent.insertMany(
    Array.from({ length: 101 }, (_, i) => ({
      owner,
      requestKey: "page-" + i,
      contextHash: "hash",
      flightId: "offer",
      origin: "LOS",
      destination: "ABV",
    })),
  );
  const older = docs[0];
  await Link.create({
    intent: older._id,
    loanReference: "OLDER-LOAN",
    reviewedBy: (await Admin.findOne())._id,
    reason: "Verified older customer application",
  });
  const headers = { "a-x-key": "admin" };
  const first = (await (await fetch(base + "/review", { headers })).json())
    .data;
  assert.equal(first.intents.length, 100);
  assert.equal(first.page.hasMore, true);
  const next = (
    await (
      await fetch(base + "/review?cursor=" + first.page.nextCursor, { headers })
    ).json()
  ).data;
  assert.equal(next.intents.length, 1);
  assert.equal(next.page.hasMore, false);
  assert.equal(next.intents[0]._id, String(older._id));
  const found = (
    await (
      await fetch(base + "/review?loanReference=OLDER-LOAN", { headers })
    ).json()
  ).data;
  assert.equal(found.intents.length, 1);
  assert.equal(found.intents[0]._id, String(older._id));
  assert.equal(
    (await fetch(base + "/review?cursor=bad", { headers })).status,
    400,
  );
});
