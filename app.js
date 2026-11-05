
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

// ==========================================
// CORS CONFIGURATION
// ==========================================

const allowedOrigins = [
  // Production domains
  'https://www.borderless.travel',
  'https://borderless.travel',

  // Local development
  'http://localhost:3000',
  'http://localhost:3001',

  // Local network development
  'http://172.20.10.4:3000',
  'http://172.20.10.4:3001',
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests without Origin (server-to-server, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Allow only trusted frontend origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`Blocked CORS request from: ${origin}`);

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },

  credentials: true,

  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
  ],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'api_key',
    'firm',
    'u-x-key',
    'Cache-Control',
    'Pragma',
    'X-Requested-With',
  ],

  optionsSuccessStatus: 204,
};

// Apply CORS before all other middleware
app.use(cors(corsOptions));

// Explicitly handle preflight requests before MongoDB
app.options('*', cors(corsOptions));

// ==========================================
// GENERAL MIDDLEWARE
// ==========================================

app.use(cookieParser());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

// ==========================================
// MONGODB CONNECTION
// ==========================================

// Connect only for actual API requests.
// OPTIONS requests are handled before reaching this middleware.

app.use(async (req, res, next) => {
  try {
    await connect();
    next();
  } catch (error) {
    console.error('MongoDB connection error:', error);

    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
    });
  }
});

// ==========================================
// API ROUTES
// ==========================================

// Website authentication
app.use('/api/v1/user-auth', userAuthRouter);
app.use('/api/v1/host-auth', hostAuthRouter);

// User routes
app.use('/api/v1/user-profile', userProfileRouter);

// Host routes
app.use('/api/v1/host-profile', hostProfileRouter);

// Admin routes
app.use('/api/v1/admin-app/admin-auth', adminAuthRouter);

app.use('/api/v1/admin-app/admin-management', adminManagementRouter);

app.use('/api/v1/admin-app/user-management', userManagementRouter);

app.use('/api/v1/admin-app/host-management', hostManagementRouter);

app.use('/api/v1/admin-app/email-subscription', emailSubManagementRouter);

app.use('/api/v1/admin-app/career-management', careerManagementRouter);

app.use('/api/v1/admin-app/booking-management', bookingManagementRouter);

// Flight routes
app.use('/api/v1/flight', flightRouter);

// General website routes
app.use('/api/v1/website', websiteRouter);

// ==========================================
// ROOT ROUTE
// ==========================================

app.get('/', (req, res) => {
  res.status(200).send('Borderless Travel Backend is running!');
});

// ==========================================
// 404 HANDLER
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Something went wrong. Please try again.',
  });
});

// ==========================================
// EXPORT FOR VERCEL
// ==========================================

module.exports = app;

// ==========================================
// LOCAL DEVELOPMENT SERVER
// ==========================================

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
