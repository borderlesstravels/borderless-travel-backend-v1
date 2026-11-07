/**
 * Express application factory (no listen).
 * Mounted by Next.js API catch-all for Vercel, or by app.js for local Express.
 */
const express = require("express");
const requestIp = require("request-ip");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { forwardAsyncErrors } = require("./async-routes");

const userAuthRouter = require("../src/routes/website/user-auth-routes");
const hostAuthRouter = require("../src/routes/website/host-auth-routes");
const userProfileRouter = require("../src/routes/user/user-profile-routes");
const hostProfileRouter = require("../src/routes/host/host-profile-routes");
const hostListingRouter = require("../src/routes/host/host-listing-routes");
const adminAuthRouter = require("../src/routes/admin/admin-auth-routes");
const adminManagementRouter = require("../src/routes/admin/admin-admin-routes");
const userManagementRouter = require("../src/routes/admin/admin-user-routes");
const hostManagementRouter = require("../src/routes/admin/admin-host-routes");
const emailSubManagementRouter = require("../src/routes/admin/admin-email-sub-routes");
const careerManagementRouter = require("../src/routes/admin/admin-career-routes");
const shortletManagementRouter = require("../src/routes/admin/admin-shortlet-routes");
const bookingManagementRouter = require("../src/routes/admin/admin-booking-routes");
const contentManagementRouter = require("../src/routes/admin/admin-content-routes");
const inventoryRouter = require("../src/routes/admin/admin-inventory-routes");
const appSettingsRouter = require("../src/routes/admin/admin-app-settings-routes");
const transferManagementsRouter = require("../src/routes/admin/admin-transfer-routes");
const agentManagementRouter = require("../src/routes/admin/admin-agent-routes");
const websiteRouter = require("../src/routes/website/general-routes");
const flightRouter = require("../src/routes/website/flight-routes");
const shortletRouter = require("../src/routes/website/shortlet-routes");
const transferRouter = require("../src/routes/website/transfer-routes");
const agentOnboardingRouter = require("../src/routes/agent/agent-onboarding-routes");
const {
  verifyAdminLoginToken,
} = require("../src/controllers/admin/admin-auth-controller");

const DEFAULT_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3001",
  "http://localhost:5500",
  "https://borderless-travel-admin-app.vercel.app",
  "https://borderless-website.onrender.com",
  "https://borderless-waitlist.onrender.com",
  "https://borderless-agents.onrender.com",
  "https://borderless.travel",
  "https://agent.borderless.travel",
  "https://admin.borderless.travel",
  "https://borderless-waitlist-admin-frontend.onrender.com",
  "https://borderless-admin.onrender.com",
  "https://borderless-frontend-test.onrender.com",
  "https://borderless-admin-test.onrender.com",
];

function parseExtraOrigins() {
  const raw = process.env.CORS_ORIGINS || "";
  return raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

function createApp() {
  const app = express();
  app.use((req, res, next) => {
    res.set("Cache-Control", "private, no-store");
    return next();
  });
  const allowedOrigins = [...DEFAULT_ORIGINS, ...parseExtraOrigins()];

  app.use(
    cors({
      credentials: true,
      origin(origin, callback) {
        // Allow non-browser clients (no Origin) and allowlisted frontends
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        // Allow Vercel preview deployments for Borderless apps when configured
        if (
          process.env.CORS_ALLOW_VERCEL_PREVIEWS === "true" &&
          /\.vercel\.app$/.test(origin)
        ) {
          return callback(null, true);
        }
        return callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      exposedHeaders: ["u-x-key", "a-x-key"],
    }),
  );

  app.use(requestIp.mw());
  app.use(cookieParser());
  app.use(express.json({ limit: "10mb", verify(req, res, buffer) {
    if (req.path === "/api/v1/website/paystack-webhook") req.rawBody = buffer;
  } }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Email HTML templates only (uploads go to Cloudinary on Vercel)
  app.use("/email-templates", express.static("public/email-templates"));

  app.use("/api/v1/user-auth", userAuthRouter);
  app.use("/api/v1/host-auth", hostAuthRouter);
  app.use("/api/v1/user-profile", userProfileRouter);
  app.use("/api/v1/host-app/profile", hostProfileRouter);
  app.use("/api/v1/host-app/listing-management", hostListingRouter);
  app.use("/api/v1/admin-app/admin-auth", adminAuthRouter);
  app.use("/api/v1/admin-app/admin-management", adminManagementRouter);
  app.use("/api/v1/admin-app/user-management", userManagementRouter);
  app.use("/api/v1/admin-app/host-management", hostManagementRouter);
  app.use("/api/v1/admin-app/email-subscription", emailSubManagementRouter);
  app.use("/api/v1/admin-app/career-management", careerManagementRouter);
  app.use("/api/v1/admin-app/shortlet-management", shortletManagementRouter);
  app.use(
    "/api/v1/admin-app/transfer-management",
    verifyAdminLoginToken,
    transferManagementsRouter,
  );
  app.use("/api/v1/admin-app/booking-management", bookingManagementRouter);
  app.use("/api/v1/admin-app/content-management", contentManagementRouter);
  app.use("/api/v1/admin-app/inventory-management", inventoryRouter);
  app.use("/api/v1/admin-app/app-settings", appSettingsRouter);
  app.use("/api/v1/admin-app/agent-management", agentManagementRouter);
  app.use("/api/v1/website", websiteRouter);
  app.use("/api/v1/flight", flightRouter);
  app.use("/api/v1/shortlet", shortletRouter);
  app.use("/api/v1/transfer", transferRouter);
  app.use("/api/v1/agent/onboarding", agentOnboardingRouter);

  // Express 4 does not forward async rejections by itself.
  for (const layer of app._router.stack) {
    if (layer.handle?.stack) forwardAsyncErrors(layer.handle);
  }

  app.get("/", (req, res) => {
    res.json({
      ok: true,
      service: "borderless-backend",
      message:
        "Hello, welcome to Borderless Travels API. Running as Next.js on Vercel.",
    });
  });

  app.get("/api/health", (req, res) => {
    res.json({ ok: true, ts: Date.now() });
  });

  // Express 4 does not catch rejected promises from async route handlers.
  // Forward them so Vercel does not hang an already-open request.
  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }
    console.error("Unhandled route error:", err?.message || err);
    return res.status(500).json({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });

  return app;
}

module.exports = { createApp, DEFAULT_ORIGINS };
