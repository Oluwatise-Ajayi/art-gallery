// This file could potentially export consolidated config settings 
// derived from environment variables, but since dotenv is loaded
// directly in server.js and db.js reads process.env directly,
// this file might not be strictly necessary unless you have
// more complex configuration logic.

// Example: Exporting derived settings or defaults
/*
module.exports = {
  port: process.env.PORT || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoURI: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '90d',
  clientURL: process.env.CLIENT_URL,
  // Add other config variables as needed
};
*/

// For now, keep it simple. Environment variables are accessed directly.

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config({
  path: path.resolve(__dirname, '../../.env')
});

// Set default NODE_ENV to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Load environment specific config
let config;
try {
  config = require(`./${process.env.NODE_ENV}`);
  console.log(`Loaded ${process.env.NODE_ENV} configuration`);
} catch (err) {
  console.error(`Failed to load ${process.env.NODE_ENV} configuration. Using development.`);
  config = require('./development');
}

// Default configuration
const defaultConfig = {
  env: process.env.NODE_ENV,
  port: process.env.PORT || 3000,
  
  // Database settings
  database: {
    uri: process.env.DATABASE_URI || 'mongodb://localhost:27017/art-gallery',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  
  // Security settings
  security: {
    cors: {
      origin: '*',
      credentials: true
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 500 // Limit each IP to 500 requests per windowMs in development
    },
    jwtSecret: process.env.JWT_SECRET || 'development-jwt-secret-not-secure',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '90d',
    jwtCookieExpiresIn: parseInt(process.env.JWT_COOKIE_EXPIRES_IN || '90')
  },
  
  // Email service settings (defaults to Ethereal for development)
  email: {
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USERNAME || 'test@ethereal.email',
      pass: process.env.EMAIL_PASSWORD || 'password'
    },
    from: {
      name: process.env.EMAIL_FROM_NAME || 'Art Gallery',
      address: process.env.EMAIL_FROM_ADDRESS || 'noreply@artgallery.test'
    }
  },
  
  // Cloudinary settings
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: 'art-gallery'
  },
  
  // Stripe settings
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_yourSecretKey',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_yourWebhookSecret'
  },
  
  // Logging settings
  logging: {
    level: 'debug',
    format: 'dev',
    logToFile: false
  }
};

// Merge default config with environment specific config
module.exports = {
  ...defaultConfig,
  ...config
}; 