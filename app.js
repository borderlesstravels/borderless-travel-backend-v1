require("dotenv").config();

const { createApp } = require("./server/createApp");
const { connect } = require("./db");

const app = createApp();

/**
 * Local Express entry (optional). Prefer `npm run dev` (Next.js) for parity with Vercel.
 * Keep this for scripts/Docker that still expect a classic Node server.
 */
if (require.main === module) {
  const port = process.env.APP_PORT || 7000;
  app.listen(port, async () => {
    try {
      await connect();
    } catch (err) {
      console.error("DB connect failed:", err);
    }
    console.log(`Listening to requests on port ${port}`);
  });
}

module.exports = app;
