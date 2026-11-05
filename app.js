
require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

const { connect } = require('./db');

// ==========================================
// ROUTES
// ==========================================

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

const allowedOrigins = [
  'https://borderless.travel',
  'https://www.borderless.travel',

  'http://localhost:3000',
  'http://localhost:3001',

  'http://172.20.10.4:3000',
  'http://172.20.10.4:3001',

  ...(process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean),
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests without browser Origin headers.
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/+$/, '');

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    console.error(`[CORS BLOCKED] ${origin}`);

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

  // Reflect requested headers during preflight.
  // Supports Authorization, api_key, firm, u-x-key, etc.
  optionsSuccessStatus: 204,

  maxAge: 86400,
};

// CORS MUST BE FIRST.
// This middleware automatically handles OPTIONS requests.
app.use(cors(corsOptions));

// ==========================================
// GENERAL MIDDLEWARE
// ==========================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb',
}));

app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// DATABASE CONNECTION
// ==========================================

app.use(async (req, res, next) => {
  try {
    // OPTIONS requests must never wait for MongoDB.
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    await connect();

    next();
  } catch (error) {
    console.error('[DATABASE CONNECTION ERROR]', error);

    return res.status(500).json({
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
  res.status(200).send(
    'Borderless Travel Backend is running!'
  );
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
  console.error('[SERVER ERROR]', {
    message: err.message,
    method: req.method,
    url: req.originalUrl,
    stack: err.stack,
  });

  if (res.headersSent) {
    return next(err);
  }

  return res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Something went wrong.',
  });
});

// ==========================================
// EXPORT EXPRESS APP FOR VERCEL
// ==========================================

module.exports = app;

// ==========================================
// LOCAL DEVELOPMENT SERVER
// ==========================================

if (require.main === module) {
  const PORT = process.env.APP_PORT || 7000;

  app.listen(PORT, async () => {
    console.log(
      `Borderless Travel API running on port ${PORT}`
    );

    try {
      await connect();
      console.log('MongoDB connected successfully');
    } catch (error) {
      console.error(
        'MongoDB connection failed:',
        error
      );
    }
  });
}
