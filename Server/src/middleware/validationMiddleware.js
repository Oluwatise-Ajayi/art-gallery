const { body, validationResult } = require('express-validator');
const AppError = require('../utils/appError');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Format errors for better readability
    const formattedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg
    }));
    return next(new AppError('Invalid input data.', 400, formattedErrors));
  }
  next();
};

exports.validateUserRegistration = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required.')
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long.'),
  body('email')
    .trim()
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.'),
  body('passwordConfirm')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match.');
      }
      return true;
    }),
  handleValidationErrors
];

// TODO: Add validation rules for other routes (login, artwork, gallery, etc.) 