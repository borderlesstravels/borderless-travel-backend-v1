require("dotenv").config();
require("./db");
const express = require("express");
const requestIp = require("request-ip");
const userAuthRouter = require("./src/routes/website/user-auth-routes");
const hostAuthRouter = require("./src/routes/website/host-auth-routes");

const userProfileRouter = require("./src/routes/user/user-profile-routes");
const hostProfileRouter = require("./src/routes/host/host-profile-routes");

const adminAuthRouter = require("./src/routes/admin/admin-auth-routes");
const adminManagementRouter = require("./src/routes/admin/admin-admin-routes");
const userManagementRouter = require("./src/routes/admin/admin-user-routes");
const hostManagementRouter = require("./src/routes/admin/admin-host-routes");
const emailSubManagementRouter = require("./src/routes/admin/admin-email-sub-routes");
const careerManagementRouter = require("./src/routes/admin/admin-career-routes");
const bookingManagementRouter = require("./src/routes/admin/admin-booking-routes");
const contentManagementRouter = require("./src/routes/admin/admin-content-routes");
const inventoryRouter = require("./src/routes/admin/admin-inventory-routes");
const appSettingsRouter = require("./src/routes/admin/admin-app-settings-routes");

const websiteRouter = require("./src/routes/website/general-routes");
const flightRouter = require("./src/routes/website/flight-routes");
const shortletRouter = require("./src/routes/website/shortlet-routes");

const cookieParser = require("cookie-parser");
const cors = require("cors");
const { connect } = require("./db");

const app = express();
app.use(
  cors({
    credentials: true,
    origin: [
      "http://localhost:3000",
      "http://localhost:7173",
      "http://localhost:7174",
      "http://localhost:3001",
      "http://localhost:5500",
      "http://127.0.0.1:5500",
      "https://borderless-travel-admin-app.vercel.app",
      "https://borderless-travels.netlify.app",
      "https://borderless-website.onrender.com",
      "https://borderless-waitlist.onrender.com",
      "https://borderless.travel",
      "https://borderless-waitlist-admin-frontend.onrender.com",
    ],
  })
);
app.use(requestIp.mw());
app.use(cookieParser());
app.use(express.json());
app.use(express.static("public"));
app.use("/api/v1/user-auth", userAuthRouter);
app.use("/api/v1/host-auth", hostAuthRouter);
app.use("/api/v1/user-profile", userProfileRouter);
app.use("/api/v1/host-profile", hostProfileRouter);

app.use("/api/v1/admin-app/admin-auth", adminAuthRouter);
app.use("/api/v1/admin-app/admin-management", adminManagementRouter);
app.use("/api/v1/admin-app/user-management", userManagementRouter);
app.use("/api/v1/admin-app/host-management", hostManagementRouter);
app.use("/api/v1/admin-app/email-subscription", emailSubManagementRouter);
app.use("/api/v1/admin-app/career-management", careerManagementRouter);
app.use("/api/v1/admin-app/booking-management", bookingManagementRouter);
app.use("/api/v1/admin-app/content-management", contentManagementRouter);
app.use("/api/v1/admin-app/inventory-management", inventoryRouter);
app.use("/api/v1/admin-app/app-settings", appSettingsRouter);

app.use("/api/v1/website", websiteRouter);
app.use("/api/v1/flight", flightRouter);
app.use("/api/v1/shortlet", shortletRouter);

app.get("/", (req, res) => {
  res.send(
    "Hello, welcome to Borderless Travels app. Server is running with latest update in April 2025"
  );
});

app.listen(process.env.APP_PORT || 7000, () => {
  connect();
  console.log(`Listening to requests on port ${process.env.APP_PORT}`);
  setInterval(() => {
    console.log("Server is live");
  }, 300000);
});
