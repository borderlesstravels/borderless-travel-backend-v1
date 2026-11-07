const crypto = require("crypto");
const matches = (expected, supplied) => typeof supplied === "string" &&
  /^[0-9a-f]{128}$/.test(supplied) && crypto.timingSafeEqual(expected, Buffer.from(supplied, "hex"));

function verifyPaystackSignature(raw, headers, env = process.env, now = Math.floor(Date.now() / 1000)) {
  if (!Buffer.isBuffer(raw)) return false;
  if (env.PAYSTACK_WEBHOOK_SECRET) {
    const header = headers["paystack-signature"];
    if (typeof header !== "string") return false;
    let timestamp;
    const signatures = [];
    for (const part of header.split(",")) {
      const index = part.indexOf("=");
      if (index < 0) continue;
      const key = part.slice(0, index).trim(), value = part.slice(index + 1).trim();
      if (key === "t") {
        if (timestamp !== undefined || !/^\d+$/.test(value)) return false;
        timestamp = Number(value);
      } else if (key === "v1") {
        const colon = value.indexOf(":");
        if (colon >= 0) signatures.push(value.slice(colon + 1));
      }
    }
    if (!Number.isSafeInteger(timestamp) || Math.abs(now - timestamp) > 300) return false;
    return [env.PAYSTACK_WEBHOOK_SECRET, env.PAYSTACK_WEBHOOK_PREVIOUS_SECRET].filter(Boolean).some(secret => {
      const hash = crypto.createHmac("sha512", secret).update(`${timestamp}.`).update(raw).digest();
      return signatures.some(signature => matches(hash, signature));
    });
  }
  // Legacy accounts use their API secret until a dedicated signing secret is configured.
  if (!env.PAYSTACK_SECRET) return false;
  const hash = crypto.createHmac("sha512", env.PAYSTACK_SECRET).update(raw).digest();
  return matches(hash, headers["x-paystack-signature"]);
}

module.exports = { verifyPaystackSignature };
