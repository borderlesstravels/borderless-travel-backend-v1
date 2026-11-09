const { consumeAuthAttempt } = require("../services/auth-rate-limit");

// Account-scoped Mongo counters work across Vercel instances. Do not trust
// client-supplied IP headers or use process-local maps as a distributed limit.
function authLimit(scope, identify, limit = 10, windowSeconds = 900) {
  return async (req, res, next) => {
    const raw = identify(req);
    const identity = typeof raw === "string" ? raw.trim()
      : typeof raw?.toHexString === "function" ? raw.toHexString() : null;
    // Let the endpoint's normal validator reject malformed identities.
    if (!identity || identity.length > 254) return next();
    try {
      await consumeAuthAttempt(scope, identity, limit, windowSeconds);
      return next();
    } catch (error) {
      if (error.retryAfter) res.set("Retry-After", String(error.retryAfter));
      return res.status(error.status || 503).json({ success: false, error: error.message });
    }
  };
}

module.exports = { authLimit };
