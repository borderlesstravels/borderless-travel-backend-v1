const { createApp } = require("../../server/createApp");
const { connect } = require("../../db");
const { withDeadline } = require("../../src/services/request-deadline");

const app = createApp();

async function handler(req, res) {
  try {
    // Bound cold connection time for GoTrip's eight-second delivery budget.
    // The cached connection may finish later; no event is acknowledged here.
    const isCreditWebhook = req.url?.split("?")[0] === "/api/v1/credit/webhook";
    if (isCreditWebhook) await withDeadline(connect(), 4000);
    else await connect();
  } catch (err) {
    console.error("Mongo connection error:", err);
    return res.status(503).json({
      success: false,
      message: "Database unavailable",
    });
  }

  return app(req, res);
}

export default handler;

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};
