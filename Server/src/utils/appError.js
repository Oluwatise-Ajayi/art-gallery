// Custom error class for operational errors (errors we can predict)
class AppError extends Error {
    constructor(message, statusCode) {
        super(message); // Call parent constructor (Error)

        this.statusCode = statusCode;
        // Determine status based on statusCode (4xx = fail, 5xx = error)
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // Mark this error as operational

        // Capture the stack trace, excluding the constructor call
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError; 