const test = require("node:test");
const assert = require("node:assert/strict");
const { withDeadline } = require("../src/services/request-deadline");
test("deadline returns completed operations and forwards storage failures", async () => {
  assert.equal(await withDeadline(Promise.resolve("stored"), 100), "stored");
  await assert.rejects(
    withDeadline(Promise.reject(new Error("storage failed")), 100),
    /storage failed/,
  );
});
test("unfinished operations return a retryable deadline, never a successful receipt", async () => {
  let complete;
  const operation = new Promise((resolve) => {
    complete = resolve;
  });
  await assert.rejects(
    withDeadline(operation, 10),
    (error) => error.code === "PROCESSING_DEADLINE",
  );
  complete("late write persisted");
  assert.equal(await operation, "late write persisted");
});
