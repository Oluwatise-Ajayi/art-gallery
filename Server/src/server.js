const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');

// Handle uncaught exceptions
process.on('uncaughtException', err => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(err.name, err.message, err.stack);
  process.exit(1);
});

// Connect to MongoDB
mongoose
  .connect(config.database.uri, config.database.options)
  .then(() => {
    logger.info(`Connected to MongoDB: ${config.database.uri}`);
  })
  .catch(err => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Start server
const server = app.listen(config.port, () => {
  logger.info(`Server running in ${config.env} mode on port ${config.port}`);
  logger.info(`API available at http://localhost:${config.port}/api/v1`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', err => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err.name, err.message, err.stack);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM signal (e.g., Heroku shutdown)
process.on('SIGTERM', () => {
  logger.info('SIGTERM RECEIVED. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated.');
  });
}); 