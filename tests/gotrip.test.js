const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const {
  verifySignature,
  parseEvent,
  applicationStatus,
  nairaToMinor,
} = require("../src/services/gotrip");
const raw = Buffer.from('{"event":"loan.approved","reference":"LN1"}');
const sign = (bytes = raw, t = 1000) =>
  `t=${t},v1=${crypto.createHmac("sha256", "test-only-secret").update(`${t}.`).update(bytes).digest("hex")}`;
test("signature uses exact bytes and rejects tampering, wrong secret and missing raw body", () => {
  assert.equal(verifySignature(raw, sign(), "test-only-secret", 1000), true);
  assert.equal(
    verifySignature(Buffer.from(raw + " "), sign(), "test-only-secret", 1000),
    false,
  );
  assert.equal(verifySignature(raw, sign(), "wrong", 1000), false);
  assert.equal(
    verifySignature(undefined, sign(), "test-only-secret", 1000),
    false,
  );
  assert.equal(verifySignature(raw, sign(), undefined, 1000), false);
});
test("new nested approval sample records exact NGN information but never confirms funding", () => {
  const parsed = parseEvent(
    {
      event: "loan.approved",
      reference: "LN-SAMPLE",
      occurred_at: "2026-11-12T10:15:00Z",
      data: {
        loan: {
          reference: "LN-SAMPLE",
          status: "approved",
          currency: "NGN",
          loan_amount: 50000,
          amount_disbursed: 50000,
        },
        user: { email: "sample@example.test" },
        form_data: { private: "not retained" },
      },
    },
    "LN-SAMPLE:loan.approved",
  );
  assert.equal(parsed.loanAmountMinor, "5000000");
  assert.equal(parsed.providerTransactionReference, "LN-SAMPLE");
  assert.equal(parsed.reportedDisbursedMinor, "5000000");
  assert.equal(parsed.customerEmail, "sample@example.test");
  assert.equal(applicationStatus([parsed]), "approved_awaiting_funding");
  assert.equal(parsed.form_data, undefined);
});
test("naira conversion is exact and rejects unsupported precision and unsafe values", () => {
  assert.equal(nairaToMinor("10000.30"), "1000030");
  assert.equal(nairaToMinor(0.01), "1");
  for (const value of [-1, NaN, Infinity, "1.001", "1e9", {}, "99999999999999"])
    assert.throws(() => nairaToMinor(value));
});
test("contradictory approval status, reference, currency and malformed amount require review", () => {
  for (const fields of [
    { status: "declined" },
    { reference: "OTHER" },
    { currency: "USD" },
    { loan_amount: "invalid" },
  ]) {
    const parsed = parseEvent(
      {
        event: "loan.approved",
        reference: "LN1",
        occurred_at: "2026-11-12T10:15:00Z",
        data: {
          loan: {
            reference: "LN1",
            status: "approved",
            currency: "NGN",
            loan_amount: 50000,
            ...fields,
          },
        },
      },
      "LN1:loan.approved",
    );
    assert.equal(parsed.disposition, "review_required");
    assert.equal(applicationStatus([parsed]), "review_required");
  }
});
test("signature rejects replay, future timestamp, duplicate fields and malformed digest", () => {
  for (const now of [699, 1301])
    assert.equal(verifySignature(raw, sign(), "test-only-secret", now), false);
  for (const header of [
    sign() + ",t=1000",
    sign() + ",v1=bad",
    "t=1000,v1=bad",
    "t=NaN,v1=" + "0".repeat(64),
  ])
    assert.equal(verifySignature(raw, header, "test-only-secret", 1000), false);
});
test("updated repayment payload is retained for review and cannot become funding", () => {
  const parsed = parseEvent(
    {
      event: "loan.repayment",
      reference: "LN1",
      occurred_at: "2026-09-29T10:15:00Z",
      data: {
        loan: { amount_disbursed: 50000 },
        user: { email: "review@example.test" },
        form_data: { passport: "private" },
      },
    },
    "LN1:loan.repayment",
  );
  assert.equal(parsed.disposition, "review_required");
  assert.equal(parsed.customerEmail, "review@example.test");
  assert.equal(parsed.data, undefined);
  assert.equal(applicationStatus([parsed]), "awaiting_application");
});
test("application projection resists out-of-order deliveries and conflicting decisions", () => {
  const event = (type) => ({ event: type, disposition: "application" });
  assert.equal(
    applicationStatus([event("loan.approved"), event("loan.created")]),
    "approved_awaiting_funding",
  );
  assert.equal(
    applicationStatus([event("loan.approved"), event("loan.declined")]),
    "review_required",
  );
  assert.equal(
    applicationStatus([event("loan.created")]),
    "application_received",
  );
});
test("invalid envelopes are rejected; future event names are review only", () => {
  assert.throws(() =>
    parseEvent({ event: "loan.created", reference: { bad: true } }, "key"),
  );
  assert.throws(() =>
    parseEvent(
      {
        event: "loan.created",
        reference: "LN1",
        occurred_at: "2026-09-29T10:15:00Z",
      },
      "changed-key",
    ),
  );
  const event = parseEvent(
    {
      event: "loan.disbursed",
      reference: 123,
      occurred_at: "2026-09-29T10:15:00Z",
    },
    "123:loan.disbursed",
  );
  assert.equal(event.disposition, "review_required");
  assert.equal(applicationStatus([event]), "awaiting_application");
});
