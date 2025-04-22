const express = require('express');
const exhibitionController = require('../controllers/ExhibitionController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// Public routes
router.route('/')
    .get(exhibitionController.getAllExhibitions);

router.route('/:id')
    .get(exhibitionController.getExhibition);

// Protected routes (Admin only for modifying exhibitions)
router.use(authMiddleware.protect);
router.use(roleMiddleware.restrictTo('admin'));

router.route('/')
    .post(exhibitionController.createExhibition);

router.route('/:id')
    .patch(exhibitionController.updateExhibition)
    .delete(exhibitionController.deleteExhibition);

module.exports = router; 