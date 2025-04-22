const express = require('express');
const router = express.Router();
const { 
  getMyOrders, 
  getOrder, 
  getAllOrders, 
  createCheckoutSession,
  webhookHandler
} = require('../controllers/OrderController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Stripe webhook handler - needs raw body, so no JSON parsing
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  webhookHandler
);

// Protected routes (require authentication)
router.use(protect);

// Create checkout session for purchasing artwork
router.post('/checkout-session/:artworkId', createCheckoutSession);

// Get current user's orders
router.get('/my-orders', getMyOrders);

// Get a specific order (only if it belongs to the current user or admin)
router.get('/:id', getOrder);

// Admin only routes
router.use(restrictTo('admin'));
router.get('/', getAllOrders);

module.exports = router; 