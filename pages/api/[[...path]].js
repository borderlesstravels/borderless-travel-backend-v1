const { createApp } = require("../../server/createApp");
const { connect } = require("../../db");

const app = createApp();

async function handler(req, res) {
  try {
    await connect();
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
