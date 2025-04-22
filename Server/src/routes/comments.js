const express = require('express');
const commentController = require('../controllers/CommentController');
const authMiddleware = require('../middleware/authMiddleware');
// const roleMiddleware = require('../middleware/roleMiddleware'); // Not strictly needed here if checks are in controller

// By setting mergeParams: true, this router can access params from parent routers (e.g., :artworkId)
const router = express.Router({ mergeParams: true });

// All comment routes require user to be logged in
router.use(authMiddleware.protect);

router.route('/')
    .get(commentController.getAllComments) // Gets comments (filtered by artworkId if nested)
    .post(
        commentController.setArtworkUserIds, // Middleware to set IDs from params/user
        // Add validation middleware here if needed
        commentController.createComment
    );

router.route('/:id')
    .get(commentController.getComment)
    .patch(
        // Add validation middleware here if needed
        commentController.updateComment // Authorization check inside controller
    )
    .delete(
        commentController.deleteComment // Authorization check inside controller
    );

module.exports = router; 