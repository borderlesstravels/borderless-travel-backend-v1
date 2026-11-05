
require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { connect } = require('./db');

// Routes
const userAuthRouter = require('./src/routes/website/user-auth-routes');
const hostAuthRouter = require('./src/routes/website/host-auth-routes');
const flightRouter = require('./src/routes/website/flight-routes');
const websiteRouter = require('./src/routes/website/general-routes');

const userProfileRouter = require('./src/routes/user/user-profile-routes');
const hostProfileRouter = require('./src/routes/host/host-profile-routes');

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

// Add production and development frontend URLs.
// Additional URLs can be supplied through ALLOWED_ORIGINS.

const allowedOrigins = [
  'https://borderless.travel',
  'https://www.borderless.travel',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://172.20.10.4:3000',
  'http://172.20.10.4:3001',
  ...(process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean),
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests without an Origin header
    // (e.g. server-to-server requests and some tools).
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`[CORS BLOCKED] Origin: ${origin}`);

    const error = new Error('Origin not allowed by CORS');
    error.status = 403;

    return callback(error);
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

  // Let the cors package reflect the browser's requested
  // headers during preflight. This avoids missing custom headers.
  optionsSuccessStatus: 204,

  maxAge: 86400,
};

// IMPORTANT: CORS must be the first middleware.
// This also handles OPTIONS preflight requests automatically.
app.use(cors(corsOptions));

// ==========================================
// GENERAL MIDDLEWARE
// ==========================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

// ==========================================
// DATABASE CONNECTION
// ==========================================

app.use(async (req, res, next) => {
  try {
    await connect();
    next();
  } catch (error) {
    console.error('[DATABASE ERROR]', error);

    res.status(500).json({
      success: false,
      message: 'Database connection failed',
    });
  }
});

// ==========================================
// API ROUTES
// ==========================================

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
  console.error('[SERVER ERROR]', err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Something went wrong.',
  });
});

// ==========================================
// EXPORT APP
// ==========================================

module.exports = app;

// ==========================================
// LOCAL DEVELOPMENT
// ==========================================

if (require.main === module) {
  const PORT = process.env.APP_PORT || 7000;

  app.listen(PORT, async () => {
    console.log(`Borderless Travel API running on port ${PORT}`);

    try {
      await connect();
      console.log('MongoDB connected successfully');
    } catch (error) {
      console.error('MongoDB connection failed:', error);
    }
  });
}
