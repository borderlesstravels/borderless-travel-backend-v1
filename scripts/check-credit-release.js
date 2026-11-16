// Offline checks only. Never loads .env, connects to a database or prints values.
const flags = [
  "GOTRIP_ENABLED",
  "GOTRIP_ACCOUNTING_ENABLED",
  "GOTRIP_TICKETING_ENABLED",
];
function checkCreditConfig(env, phase = "disabled") {
  const checks = [];
  const add = (name, ok) => checks.push({ name, ok });
  add(
    "known release phase",
    ["disabled", "intake", "accounting", "ticketing"].includes(phase),
  );
  for (const flag of flags)
    add(
      flag + " is an explicit boolean",
      ["true", "false"].includes(env[flag]),
    );
  const enabled = flags.map((key) => env[key] === "true");
  add("accounting requires intake", !enabled[1] || enabled[0]);
  add("ticketing requires accounting", !enabled[2] || enabled[1]);
  const expected = {
    disabled: [false, false, false],
    intake: [true, false, false],
    accounting: [true, true, false],
    ticketing: [true, true, true],
  }[phase];
  if (expected)
    add(
      "flags match requested phase",
      expected.every((value, i) => value === enabled[i]),
    );
  add(
    "production E2E disabled",
    env.NODE_ENV !== "production" ||
      !["E2E_TEST_MODE", "CREDIT_REVIEW_DEMO"].some(
        (key) => env[key] === "true",
      ),
  );
  if (phase !== "disabled") {
    for (const name of [
      "DB_URI",
      "JWT_ADMIN_SECRET_KEY",
      "JWT_USER_SECRET_KEY",
      "GOTRIP_WEBHOOK_SECRET",
    ])
      add(
        name + " configured",
        typeof env[name] === "string" && env[name].trim().length > 0,
      );
    add(
      "webhook secret has adequate length",
      typeof env.GOTRIP_WEBHOOK_SECRET === "string" &&
        Buffer.byteLength(env.GOTRIP_WEBHOOK_SECRET) >= 32,
    );
  }
  if (["accounting", "ticketing"].includes(phase)) {
    add("Tiqwa token configured", !!env.TIQWA_BEARER_TOKEN?.trim());
    let secure = false;
    try {
      const u = new URL(env.TIQWA_FLIGHT_API);
      secure = u.protocol === "https:" && !u.username && !u.password;
    } catch {}
    add("Tiqwa API uses HTTPS without URL credentials", secure);
  }
  return checks;
}
module.exports = { checkCreditConfig };
if (require.main === module) {
  const phase =
    process.argv.find((a) => a.startsWith("--phase="))?.split("=")[1] ||
    "disabled";
  const checks = checkCreditConfig(process.env, phase);
  for (const item of checks)
    console.log(`${item.ok ? "PASS" : "FAIL"} ${item.name}`);
  console.log(
    "Offline configuration check only. Not proof of provider, database, bank or deployment readiness.",
  );
  process.exitCode = checks.every((item) => item.ok) ? 0 : 1;
}
