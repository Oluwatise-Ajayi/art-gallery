const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');

const globalErrorHandler = require('./utils/errorHandler');
const apiRoutes = require('./routes'); // Main router

const app = express();

// --- Global Middleware ---

// Enable CORS
app.use(cors({
  // Configure allowed origins based on environment
  origin: process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : '*',
  credentials: true
}));

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 10 minutes'
});
app.use('/api', limiter); // Apply limiter to all API routes

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' })); // Limit request body size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
  whitelist: [
    // Add fields here that are allowed to appear multiple times in query strings
    'price', 'year', 'medium', 'tags'
  ]
}));

// --- Routes ---
app.use('/api/v1', apiRoutes); // Mount main API router

// Serve static assets if in production (e.g., for admin panel build)
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  // app.use(express.static('client/build'));
  // app.get('*', (req, res) => {
  //   res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  // });
} else {
    app.get('/', (req, res) => {
        res.send('API is running in development mode...');
    });
}

// --- Error Handling ---
// Handle 404 errors for undefined routes
app.all('*', (req, res, next) => {
    const err = new Error(`Can't find ${req.originalUrl} on this server!`);
    err.status = 'fail';
    err.statusCode = 404;
    next(err);
});

// Global error handling middleware
app.use(globalErrorHandler);


module.exports = app; 