const express = require('express');
const userController = require('../controllers/UserController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// All routes below this point require authentication
router.use(authMiddleware.protect);

// Routes for the logged-in user
router.get('/me', userController.getMe, userController.getUser); // Use getMe to set params.id, then getUser
router.patch('/updateMe', userController.updateMe); // TODO: Add upload middleware for profile pic
router.delete('/deleteMe', userController.deleteMe);
// TODO: Add routes for password updates, managing favorites etc.

// --- Admin Only Routes ---
// All routes below require admin role
router.use(roleMiddleware.restrictTo('admin'));

router.route('/')
    .get(userController.getAllUsers);
    // POST for creating users is handled by authController.signup

router.route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser) // For admin updates to any user
    .delete(userController.deleteUser);

module.exports = router; 