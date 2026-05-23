const path = require('path');

// Try .env from multiple locations (works locally & on Render where rootDir=backend)
require('dotenv').config({ path: path.join(__dirname, '../../..', '.env') }); // project root
require('dotenv').config({ path: path.join(__dirname, '../..', '.env') });    // backend root

// Parse CORS_ORIGIN — supports comma-separated origins
// e.g. CORS_ORIGIN=https://app.vercel.app,http://localhost:5173
function parseCorsOrigin(envValue) {
  if (!envValue) return 'http://localhost:5173';
  const origins = envValue.split(',').map((o) => o.trim()).filter(Boolean);
  return origins.length === 1 ? origins[0] : origins;
}

const config = {
  port: parseInt(process.env.PORT || process.env.BACKEND_PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: parseCorsOrigin(process.env.CORS_ORIGIN),
  mlApiUrl: process.env.ML_API_URL || `http://localhost:${process.env.ML_API_PORT || 8000}`,

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
};

module.exports = config;
