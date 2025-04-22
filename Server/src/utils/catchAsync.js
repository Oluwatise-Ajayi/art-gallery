// Utility function to wrap async route handlers and catch errors
// Avoids writing try/catch blocks in every async controller function
const catchAsync = fn => {
    // Return an anonymous function that Express will call
    return (req, res, next) => {
        // fn(req, res, next) returns a Promise
        // If the promise rejects, catch the error and pass it to the global error handler
        fn(req, res, next).catch(next); // Equivalent to .catch(err => next(err))
    };
};

module.exports = catchAsync; 