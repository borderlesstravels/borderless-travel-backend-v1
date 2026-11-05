
require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const { connect } = require('./db');

// Website routes
const userAuthRouter = require('./src/routes/website/user-auth-routes');
const hostAuthRouter = require('./src/routes/website/host-auth-routes');
const flightRouter = require('./src/routes/website/flight-routes');
const websiteRouter = require('./src/routes/website/general-routes');

// User routes
const userProfileRouter = require('./src/routes/user/user-profile-routes');

// Host routes
const hostProfileRouter = require('./src/routes/host/host-profile-routes');

// Admin routes
const adminAuthRouter = require('./src/routes/admin/admin-auth-routes');
const adminManagementRouter = require('./src/routes/admin/admin-admin-routes');
const userManagementRouter = require('./src/routes/admin/admin-user-routes');
const hostManagementRouter = require('./src/routes/admin/admin-host-routes');
const emailSubManagementRouter = require('./src/routes/admin/admin-email-sub-routes');
const careerManagementRouter = require('./src/routes/admin/admin-career-routes');
const bookingManagementRouter = require('./src/routes/admin/admin-booking-routes');

const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    'https://www.borderless.travel',
    'https://borderless.travel',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://172.20.10.4:3000',
    'http://172.20.10.4:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'api_key',
    'firm',
    'u-x-key',
    'Cache-Control',
    'Pragma'
  ]
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// General middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// MongoDB connection
app.use(async (req, res, next) => {
  try {
    await connect();
    next();
  } catch (error) {
    console.error('MongoDB connection error:', error);

    res.status(500).json({
      success: false,
      message: 'Database connection failed'
    });
  }
});

// API routes
app.use('/api/v1/user-auth', userAuthRouter);
app.use('/api/v1/host-auth', hostAuthRouter);

app.use('/api/v1/user-profile', userProfileRouter);
app.use('/api/v1/host-profile', hostProfileRouter);

app.use('/api/v1/admin-app/admin-auth', adminAuthRouter);
app.use('/api/v1/admin-app/admin-management', adminManagementRouter);
app.use('/api/v1/admin-app/user-management', userManagementRouter);
app.use('/api/v1/admin-app/host-management', hostManagementRouter);
app.use('/api/v1/admin-app/email-subscription', emailSubManagementRouter);
app.use('/api/v1/admin-app/career-management', careerManagementRouter);
app.use('/api/v1/admin-app/booking-management', bookingManagementRouter);

app.use('/api/v1/flight', flightRouter);
app.use('/api/v1/website', websiteRouter);

// Root route
app.get('/', (req, res) => {
  res.status(200).send('Borderless Travel Backend is running!');
});

// Export Express app for Vercel
module.exports = app;

// Start server locally only
if (require.main === module) {
  const PORT = process.env.APP_PORT || 7000;

  app.listen(PORT, async () => {
    try {
      await connect();
      console.log(`Server listening on port ${PORT}`);
    } catch (error) {
      console.error('MongoDB connection failed:', error);
    }
  });
}
