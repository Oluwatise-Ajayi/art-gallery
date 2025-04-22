const express = require('express');
const authController = require('../controllers/AuthController');
// Optional: Add input validation middleware if desired
// const { validateSignup, validateLogin } = require('../middleware/validationMiddleware');

const router = express.Router();

// Public routes
router.post('/signup', /* validateSignup, */ authController.signup);
router.post('/login', /* validateLogin, */ authController.login);

// Route for logout (could be GET or POST)
router.get('/logout', authController.logout);
// router.post('/logout', authController.logout); // Alternative

// Example protected route (requires authMiddleware.protect)
// const { protect } = require('../middleware/authMiddleware');
// router.get('/me', protect, userController.getMe); // Assuming a getMe function exists in UserController

module.exports = router; 