// Serverless entry for Vercel — must live at /api/index.js (repo root)

const allowedOrigins = [
  'https://www.borderless.travel',
  'https://borderless.travel',
  'http://localhost:3000',
  'http://localhost:3001',
];

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,PATCH,DELETE,OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Accept, api_key, firm, u-x-key, Cache-Control, Pragma, X-Requested-With'
  );
}

let app;
try {
  // Change to your real main file if needed: ../app.js | ../server.js | ../index.js
  app = require('../../app');
} catch (err) {
  console.error('Failed to load Express app:', err);
}

module.exports = (req, res) => {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (!app) {
    return res.status(500).json({
      success: false,
      error: 'App failed to load. Check Vercel logs.',
    });
  }

  return app(req, res);
};