const express = require('express');
const adminController = require('../controllers/AdminController');
const userController = require('../controllers/UserController'); // For admin user management
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// All admin routes require login AND admin role
router.use(authMiddleware.protect);
router.use(roleMiddleware.restrictTo('admin'));

// --- Dashboard Routes ---
router.get('/dashboard/stats', adminController.getAdminDashboardStats);

// --- User Management (Example routes, could be nested under /users) ---
// These routes are already defined in users.js but restricted to admin there.
// If you prefer a dedicated /admin/users endpoint:
// router.route('/users')
//     .get(userController.getAllUsers);
// router.route('/users/:id')
//     .get(userController.getUser)
//     .patch(userController.updateUser)
//     .delete(userController.deleteUser);

router.patch('/users/change-role', adminController.changeUserRole);

// --- Content Management Routes (Examples) ---
// Add routes for managing galleries, exhibitions, artworks if specific admin actions are needed
// e.g., router.patch('/artworks/:id/feature', artworkController.featureArtwork);
// e.g., router.get('/comments/reported', commentController.getReportedComments);


module.exports = router; 