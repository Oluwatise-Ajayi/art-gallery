const AppError = require('../utils/appError');

// Middleware generator function to restrict access based on roles
// Accepts allowed roles as arguments (e.g., restrictTo('admin', 'artist'))
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // req.user should be attached by the preceding `protect` middleware
    if (!req.user) {
        // This should ideally not happen if protect runs first, but as a safeguard:
        return next(new AppError('Authentication required before checking roles.', 401));
    }

    // Check if the user's role is included in the allowed roles
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403) // 403 Forbidden
      );
    }

    // If role is allowed, proceed to the next middleware/controller
    next();
  };
};

module.exports = { restrictTo }; 