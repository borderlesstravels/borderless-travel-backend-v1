// A timed-out write may still finish. Its caller must use durable idempotency
// and return a retryable response, never assume the write failed or succeeded.
async function withDeadline(operation, milliseconds) {
  let timer;
  try {
    return await Promise.race([
      operation,
      new Promise((resolve, reject) => {
        timer = setTimeout(() => {
          const error = new Error("Request processing deadline exceeded");
          error.code = "PROCESSING_DEADLINE";
          reject(error);
        }, milliseconds);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
module.exports = { withDeadline };
