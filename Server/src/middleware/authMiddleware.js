const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const AppError = require('../utils/appError'); // Assuming you have a custom error class
const catchAsync = require('../utils/catchAsync'); // Assuming you have an async error handler

// Middleware to protect routes - verify token and attach user to request
exports.protect = catchAsync(async (req, res, next) => {
    // 1) Getting token and check if it exists
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } 
    // else if (req.cookies.jwt) { // Optional: Check for token in cookies
    //     token = req.cookies.jwt;
    // }

    if (!token) {
        return next(
            new AppError('You are not logged in! Please log in to get access.', 401)
        );
    }

    // 2) Verification token
    let decoded;
    try {
        decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    } catch (err) {
        // Handle different JWT errors (expired, invalid signature etc.)
        if (err.name === 'JsonWebTokenError') {
            return next(new AppError('Invalid token. Please log in again.', 401));
        }
        if (err.name === 'TokenExpiredError') {
            return next(new AppError('Your token has expired! Please log in again.', 401));
        }
        // For other errors, pass them down
        return next(err);
    }

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(
            new AppError('The user belonging to this token no longer exists.', 401)
        );
    }

    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(
            new AppError('User recently changed password! Please log in again.', 401)
        );
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser; // Attach user object to the request
    res.locals.user = currentUser; // Make user available in templates (if using server-side rendering)
    next();
});

// Optional: Middleware to check if user is logged in (useful for views)
// exports.isLoggedIn = async (req, res, next) => {
//     // ... similar logic to protect, but calls next() even if not logged in
//     // ... attaches user to res.locals if logged in
// }; 