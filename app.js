require('dotenv').config();
require('./db');
const express = require('express');
const userAuthRouter = require('./src/routes/website/user-auth-routes');
const hostAuthRouter = require('./src/routes/website/host-auth-routes');
const userProfileRouter = require('./src/routes/user/user-profile-routes');
const adminAuthRouter = require('./src/routes/admin/admin-auth-routes');
const adminManagementRouter = require('./src/routes/admin/admin-admin-routes');
const userManagementRouter = require('./src/routes/admin/admin-user-routes');
const hostManagementRouter = require('./src/routes/admin/admin-host-routes');
const emailSubManagementRouter = require('./src/routes/admin/admin-email-sub-routes');
const careerManagementRouter = require('./src/routes/admin/admin-career-routes');
const bookingManagementRouter = require('./src/routes/admin/admin-booking-routes');
const flightRouter = require('./src/routes/website/flight-routes');
const websiteRouter = require('./src/routes/website/general-routes');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { connect } = require('./db');

const app = express();
app.use(
  cors({
    credentials: true,
    origin: [
      'http://localhost:3000',
      'http://172.20.10.4:3000',
      'http://localhost:3001',
      'http://172.20.10.4:3001',
    ],
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.static('public'));
app.use('/api/v1/user-auth', userAuthRouter);
app.use('/api/v1/host-auth', hostAuthRouter);
app.use('/api/v1/user-profile', userProfileRouter);
app.use('/api/v1/admin-app/admin-auth', adminAuthRouter);
app.use('/api/v1/admin-app/admin-management', adminManagementRouter);
app.use('/api/v1/admin-app/user-management', userManagementRouter);
app.use('/api/v1/admin-app/host-management', hostManagementRouter);
app.use('/api/v1/admin-app/email-subscription', emailSubManagementRouter);
app.use('/api/v1/admin-app/career-management', careerManagementRouter);
app.use('/api/v1/admin-app/booking-management', bookingManagementRouter);
app.use('/api/v1/flight', flightRouter);
app.use('/api/v1/website', websiteRouter);

app.listen(process.env.APP_PORT || 7000, () => {
  connect();
  console.log(`Listening to requests on port ${process.env.APP_PORT}`);
});

module.exports = app;
