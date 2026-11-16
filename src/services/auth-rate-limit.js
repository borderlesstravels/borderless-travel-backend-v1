const crypto = require("crypto");
const Bucket = require("../models/general/AuthRateBucket");
const { PaymentError } = require("./payment-integrity");

async function consumeAuthAttempt(scope, identity, limit, windowSeconds, now = Date.now()) {
  const window = Math.floor(now / (windowSeconds * 1000));
  const key = crypto.createHash("sha256").update(JSON.stringify([scope, identity.toLowerCase(), window])).digest("hex");
  try {
    await Bucket.findOneAndUpdate({ _id: key, count: { $lt: limit } }, {
      $inc: { count: 1 }, $setOnInsert: { expires_at: new Date((window + 1) * windowSeconds * 1000 + 3600000) },
    }, { upsert: true, new: true, setDefaultsOnInsert: false });
  } catch (error) {
    if (error.code === 11000) {
      const limited = new PaymentError("Too many authentication attempts. Please try again later.", 429);
      limited.retryAfter = Math.max(1, Math.ceil(((window + 1) * windowSeconds * 1000 - now) / 1000));
      throw limited;
    }
    throw new PaymentError("Authentication protection is temporarily unavailable", 503);
  }
}

module.exports = { consumeAuthAttempt };
