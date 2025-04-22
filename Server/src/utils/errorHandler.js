const AppError = require('./appError');

// --- Specific Error Handlers ---

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400); // 400 Bad Request
};

const handleDuplicateFieldsDB = err => {
  // Extract value from error message using regex
  const value = err.errmsg.match(/(?<=")(?:\\.|[^"\\])*(?=")/)[0];
  // console.log(value);
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401);

// --- Environment-Specific Error Senders ---

const sendErrorDev = (err, req, res) => {
  // API Error
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }
  // RENDERED WEBSITE Error (If applicable)
  console.error('ERROR 💥', err);
  // Example: Render an error page
  // return res.status(err.statusCode).render('error', {
  //   title: 'Something went wrong!',
  //   msg: err.message
  // });
  // Fallback for non-API, non-rendered errors
  return res.status(err.statusCode).send('Something went very wrong!');
};

const sendErrorProd = (err, req, res) => {
  // A) API Error
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    // Programming or other unknown error: don't leak error details
    // 1) Log error
    console.error('ERROR 💥', err);
    // 2) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    });
  }
  // B) RENDERED WEBSITE Error (If applicable)
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    // Example: Render an error page
    // return res.status(err.statusCode).render('error', {
    //   title: 'Something went wrong!',
    //   msg: err.message
    // });
    return res.status(err.statusCode).send(err.message);

  }
  // Programming or other unknown error: don't leak error details
  // 1) Log error
  console.error('ERROR 💥', err);
  // 2) Send generic message
  // Example: Render generic error page
  // return res.status(err.statusCode).render('error', {
  //   title: 'Something went wrong!',
  //   msg: 'Please try again later.'
  // });
  return res.status(500).send('Something went very wrong!');
};

// --- Global Error Handling Middleware ---

module.exports = (err, req, res, next) => {
  // console.log(err.stack);

  err.statusCode = err.statusCode || 500; // Default to 500 Internal Server Error
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err }; // Create a hard copy
    error.message = err.message; // Copy message separately as it might not be enumerable
    error.name = err.name; // Copy name

    // Handle specific Mongoose/JWT errors for cleaner production messages
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error); // MongoDB duplicate key error
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
}; 