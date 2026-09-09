// Cron helper endpoint for cron-job.org (optional).
// Protect with CRON_SECRET. Add real jobs here when needed.

const { connect } = require("../../../db");

async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const secret = process.env.CRON_SECRET;
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ")
    ? auth.slice(7)
    : req.headers["x-cron-secret"];

  if (!secret || token !== secret) {
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  }

  try {
    await connect();
  } catch (err) {
    console.error(err);
    return res.status(503).json({ ok: false, message: "Database unavailable" });
  }

  return res.status(200).json({
    ok: true,
    message: "Cron ping accepted",
    ts: Date.now(),
  });
}

export default handler;
