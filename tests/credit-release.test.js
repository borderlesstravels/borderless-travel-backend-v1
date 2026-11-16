const test = require("node:test");
const assert = require("node:assert/strict");
const { checkCreditConfig } = require("../scripts/check-credit-release");
const disabled = {
  GOTRIP_ENABLED: "false",
  GOTRIP_ACCOUNTING_ENABLED: "false",
  GOTRIP_TICKETING_ENABLED: "false",
  NODE_ENV: "production",
};
test("release preflight requires explicit disabled flags and rejects partial enablement", () => {
  assert.ok(checkCreditConfig(disabled).every((c) => c.ok));
  assert.ok(
    checkCreditConfig({ ...disabled, GOTRIP_TICKETING_ENABLED: "true" }).some(
      (c) => !c.ok,
    ),
  );
  assert.ok(checkCreditConfig({}).some((c) => !c.ok));
});
test("intake needs authentication and webhook settings without leaking their values", () => {
  const env = {
    ...disabled,
    GOTRIP_ENABLED: "true",
    DB_URI: "local-placeholder",
    JWT_ADMIN_SECRET_KEY: "admin-example",
    JWT_USER_SECRET_KEY: "user-example",
    GOTRIP_WEBHOOK_SECRET: "s".repeat(32),
  };
  assert.ok(checkCreditConfig(env, "intake").every((c) => c.ok));
  assert.ok(
    !JSON.stringify(checkCreditConfig(env, "intake")).includes("admin-example"),
  );
  assert.ok(
    checkCreditConfig({ ...env, E2E_TEST_MODE: "true" }, "intake").some(
      (c) => !c.ok,
    ),
  );
  assert.ok(
    checkCreditConfig({ ...env, GOTRIP_WEBHOOK_SECRET: "" }, "intake").some(
      (c) => !c.ok,
    ),
  );
});
test("accounting and ticketing require secure provider configuration and sequential gates", () => {
  const env = {
    ...disabled,
    GOTRIP_ENABLED: "true",
    GOTRIP_ACCOUNTING_ENABLED: "true",
    DB_URI: "placeholder",
    JWT_ADMIN_SECRET_KEY: "admin",
    JWT_USER_SECRET_KEY: "user",
    GOTRIP_WEBHOOK_SECRET: "s".repeat(32),
    TIQWA_BEARER_TOKEN: "token",
    TIQWA_FLIGHT_API: "https://provider.example.test",
  };
  assert.ok(checkCreditConfig(env, "accounting").every((c) => c.ok));
  assert.ok(
    checkCreditConfig(
      { ...env, TIQWA_FLIGHT_API: "http://provider.example.test" },
      "accounting",
    ).some((c) => !c.ok),
  );
  assert.ok(
    checkCreditConfig(
      { ...env, GOTRIP_TICKETING_ENABLED: "true" },
      "ticketing",
    ).every((c) => c.ok),
  );
});
