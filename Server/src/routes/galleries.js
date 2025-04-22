const express = require('express');
const galleryController = require('../controllers/GalleryController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// Public routes
router.route('/')
    .get(galleryController.getAllGalleries);

router.route('/:id')
    .get(galleryController.getGallery);

// Protected routes (Admin only for modifying galleries)
router.use(authMiddleware.protect);
router.use(roleMiddleware.restrictTo('admin'));

router.route('/')
    .post(galleryController.createGallery);

router.route('/:id')
    .patch(galleryController.updateGallery)
    .delete(galleryController.deleteGallery);

module.exports = router; 