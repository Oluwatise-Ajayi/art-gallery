/**
 * Production-specific configuration
 * These settings will be used when NODE_ENV=production
 */

// Ensure all required environment variables are set
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'DATABASE_URI',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'JWT_COOKIE_EXPIRES_IN',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USERNAME',
  'EMAIL_PASSWORD',
  'EMAIL_FROM_ADDRESS',
  'EMAIL_FROM_NAME',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'CLIENT_URL'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// Export production configuration
module.exports = {
  // Server settings
  port: process.env.PORT || 5000,
  
  // Database settings
  database: {
    uri: process.env.DATABASE_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: false, // Don't build indexes in production
    }
  },
  
  // Security settings
  security: {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // Limit each IP to 100 requests per windowMs
    },
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    jwtCookieExpiresIn: parseInt(process.env.JWT_COOKIE_EXPIRES_IN || '7'),
    // Always use HTTPS in production
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: 'strict'
    }
  },
  
  // Email service settings
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    },
    from: {
      name: process.env.EMAIL_FROM_NAME,
      address: process.env.EMAIL_FROM_ADDRESS
    }
  },
  
  // Cloudinary settings
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: 'art-gallery-prod'
  },
  
  // Stripe settings
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
  },
  
  // Logging settings
  logging: {
    level: 'info',
    format: 'combined',
    logToFile: true,
    logDir: 'logs'
  }
}; 