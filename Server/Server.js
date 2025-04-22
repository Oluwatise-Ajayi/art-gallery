require('dotenv').config(); // Load environment variables at the very top
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const app = require('./src/app');

// Handle Uncaught Exceptions (Sync code)
process.on('uncaughtException', err => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    process.exit(1); // 1 indicates failure
});

// Connect to Database
connectDB();

const PORT = process.env.PORT || 5001; // Use environment variable or default

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle Unhandled Promise Rejections (Async code)
process.on('unhandledRejection', err => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    // Close server & exit process
    server.close(() => {
        process.exit(1); // 1 indicates failure
    });
});

// Handle SIGTERM signal (e.g., from platform shutdowns like Heroku)
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
    server.close(() => {
        console.log('💥 Process terminated!');
        // Mongoose connection closed automatically on process exit
    });
});