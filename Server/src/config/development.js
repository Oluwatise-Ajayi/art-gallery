/**
 * Development-specific configuration
 * These settings will be used when NODE_ENV=development
 */

module.exports = {
  // Override default settings for development environment
  
  // Server settings
  port: process.env.PORT || 5000,
  
  // Database settings
  database: {
    uri: process.env.DATABASE_URI || 'mongodb://localhost:27017/art-gallery-dev',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: true // Auto-index in development
    }
  },
  
  // Security settings
  security: {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000', // React dev server
      credentials: true
    },
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-do-not-use-in-production',
    cookie: {
      secure: false, // Allow HTTP in development
      httpOnly: true,
      sameSite: 'lax'
    }
  },
  
  // Email service settings
  // For development, you can use Ethereal (https://ethereal.email/)
  // or a service like Mailtrap (https://mailtrap.io/)
  email: {
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  },
  
  // Cloudinary settings
  cloudinary: {
    // Use the same settings from .env but with a dev folder
    folder: 'art-gallery-dev'
  },
  
  // Logging settings
  logging: {
    level: 'debug',
    format: 'dev',
    logToFile: false
  }
}; 