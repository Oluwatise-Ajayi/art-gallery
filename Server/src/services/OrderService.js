const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const Artwork = require('../models/Artwork');
const AppError = require('../utils/appError');
const emailService = require('./EmailService');

/**
 * Service class for handling order-related business logic
 */
class OrderService {
  /**
   * Create a Stripe checkout session
   * @param {String} artworkId - Artwork ID
   * @param {Object} user - User making the purchase
   * @param {String} host - Host for success/cancel URLs
   * @returns {Promise<Object>} - Stripe session
   * @throws {AppError} - If artwork not found or already sold
   */
  async createCheckoutSession(artworkId, user, host) {
    // Get artwork and verify it's available
    const artwork = await Artwork.findById(artworkId).populate('artist');
    
    if (!artwork) {
      throw new AppError('Artwork not found', 404);
    }
    
    if (artwork.sold) {
      throw new AppError('This artwork has already been sold', 400);
    }
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: `${host}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${host}/artworks/${artwork.id}`,
      customer_email: user.email,
      client_reference_id: artwork.id,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: artwork.title,
              description: `By ${artwork.artist.name}`,
              images: [artwork.imageUrl],
            },
            unit_amount: artwork.price * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
    });
    
    // Create pending order
    await this.createOrder({
      artwork: artwork.id,
      user: user.id,
      price: artwork.price,
      paymentStatus: 'pending',
      stripeSessionId: session.id,
    });
    
    return session;
  }
  
  /**
   * Create an order
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} - Created order
   */
  async createOrder(orderData) {
    const order = await Order.create(orderData);
    return order;
  }
  
  /**
   * Handle successful Stripe webhook event
   * @param {Object} sessionData - Stripe session data
   * @returns {Promise<Object>} - Updated order
   */
  async handleCheckoutSuccess(sessionData) {
    // Find order by Stripe session ID
    const order = await Order.findOneAndUpdate(
      { stripeSessionId: sessionData.id },
      { 
        paymentStatus: 'paid',
        paidAt: Date.now()
      },
      { new: true }
    ).populate('user').populate({
      path: 'artwork',
      populate: { path: 'artist' }
    });
    
    if (!order) {
      throw new AppError(`Order not found for session: ${sessionData.id}`, 404);
    }
    
    // Mark artwork as sold
    await Artwork.findByIdAndUpdate(order.artwork._id, { sold: true });
    
    // Send order confirmation email
    await emailService.sendOrderConfirmationEmail(order, order.user);
    
    return order;
  }
  
  /**
   * Get user's orders
   * @param {String} userId - User ID
   * @param {Object} queryFeatures - APIFeatures instance
   * @returns {Promise<Array>} - User's orders
   */
  async getUserOrders(userId, queryFeatures) {
    const features = queryFeatures
      .filter()
      .sort()
      .limitFields()
      .paginate();
      
    const orders = await features.query.populate({
      path: 'artwork',
      populate: { path: 'artist', select: 'name' }
    });
    
    return orders;
  }
  
  /**
   * Get all orders (admin)
   * @param {Object} queryFeatures - APIFeatures instance
   * @returns {Promise<Array>} - All orders
   */
  async getAllOrders(queryFeatures) {
    const features = queryFeatures
      .filter()
      .sort()
      .limitFields()
      .paginate();
      
    const orders = await features.query.populate('user', 'name email').populate({
      path: 'artwork',
      populate: { path: 'artist', select: 'name' }
    });
    
    return orders;
  }
  
  /**
   * Get order by ID
   * @param {String} orderId - Order ID
   * @param {String} userId - User ID making the request
   * @param {String} userRole - User role
   * @returns {Promise<Object>} - Order
   * @throws {AppError} - If order not found or unauthorized
   */
  async getOrderById(orderId, userId, userRole) {
    const order = await Order.findById(orderId)
      .populate('user', 'name email')
      .populate({
        path: 'artwork',
        populate: { path: 'artist', select: 'name' }
      });
      
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    
    // Ensure users can only see their own orders (admins can see all)
    if (order.user._id.toString() !== userId && userRole !== 'admin') {
      throw new AppError('You do not have permission to view this order', 403);
    }
    
    return order;
  }
  
  /**
   * Update order status (admin)
   * @param {String} orderId - Order ID
   * @param {String} status - New status
   * @returns {Promise<Object>} - Updated order
   * @throws {AppError} - If order not found
   */
  async updateOrderStatus(orderId, status) {
    const allowedUpdates = { status };

    const order = await Order.findByIdAndUpdate(
      orderId, 
      allowedUpdates,
      {
        new: true,
        runValidators: true
      }
    );

    if (!order) {
      throw new AppError('Order not found', 404);
    }
    
    // Notify customer about status change
    if (order.user) {
      // TODO: Send status update email
    }
    
    return order;
  }
}

module.exports = new OrderService(); 