const express = require('express');
const artworkController = require('../controllers/ArtworkController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const commentRouter = require('./comments'); // Import comment router for nesting

const router = express.Router();

// --- Nested Routes ---
// Redirect requests like POST /api/v1/artworks/:artworkId/comments to the comment router
router.use('/:artworkId/comments', commentRouter);

// --- Public Routes ---
router.route('/')
    .get(artworkController.getAllArtworks);

router.route('/:id')
    .get(artworkController.getArtwork);

// --- Protected Routes (Require Login) ---
router.use(authMiddleware.protect);

router.route('/')
    .post(roleMiddleware.restrictTo('admin', 'artist'), /* uploadMiddleware, */ artworkController.createArtwork);

router.route('/:id')
    .patch(roleMiddleware.restrictTo('admin', 'artist'), /* uploadMiddleware, */ artworkController.updateArtwork)
    .delete(roleMiddleware.restrictTo('admin', 'artist'), artworkController.deleteArtwork);

// Like/Unlike routes (any logged-in user)
router.patch('/:id/like', artworkController.likeArtwork);
router.patch('/:id/unlike', artworkController.unlikeArtwork);

// TODO: Add route for uploading artwork image separately if needed

module.exports = router; 