const express = require("express");
const router = express.Router();
const { createUser, loginUser } = require("../controllers/User");
const { validateUserRegistration } = require('../middleware/validationMiddleware');
const { forgotPassword, resetPassword, updatePassword } = require('../controllers/UserController');
const { protect } = require('../middleware/authMiddleware');

router.post("/register", validateUserRegistration, createUser);
router.post("/login", loginUser);

// Password reset routes
router.post("/forgotPassword", forgotPassword);
router.patch("/resetPassword/:token", resetPassword);

// Protected routes (require authentication)
router.patch("/updateMyPassword", protect, updatePassword);

module.exports = router;
