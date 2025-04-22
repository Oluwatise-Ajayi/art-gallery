// Placeholder for Order Controller (E-commerce)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const Artwork = require('../models/Artwork');
const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/APIFeatures');
const emailService = require('../services/EmailService');

// Get logged in user's orders
exports.getMyOrders = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(Order.find({ user: req.user.id }), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
        
    const orders = await features.query.populate({
        path: 'artwork',
        populate: { path: 'artist', select: 'name' }
    });
    
    res.status(200).json({
        status: 'success',
        results: orders.length,
        data: { orders }
    });
});

// --- Admin Only --- 
exports.getAllOrders = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(Order.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
        
    const orders = await features.query.populate('user', 'name email').populate({
        path: 'artwork',
        populate: { path: 'artist', select: 'name' }
    });
    
    res.status(200).json({
        status: 'success',
        results: orders.length,
        data: { orders }
    });
});

exports.getOrder = catchAsync(async (req, res, next) => {
    const order = await Order.findById(req.params.id)
        .populate('user', 'name email')
        .populate({
            path: 'artwork',
            populate: { path: 'artist', select: 'name' }
        });
        
    if (!order) {
        return next(new AppError('Order not found', 404));
    }
    
    // Ensure users can only see their own orders (admins can see all)
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new AppError('You do not have permission to view this order', 403));
    }
    
    res.status(200).json({
        status: 'success',
        data: { order }
    });
});

// Create a checkout session for purchasing artwork
exports.createCheckoutSession = catchAsync(async (req, res, next) => {
    // 1) Get artwork data and verify availability
    const artwork = await Artwork.findById(req.params.artworkId).populate('artist');
    
    if (!artwork) {
        return next(new AppError('Artwork not found', 404));
    }
    
    if (artwork.sold) {
        return next(new AppError('This artwork has already been sold', 400));
    }
    
    // 2) Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        success_url: `${req.protocol}://${req.get('host')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get('host')}/artworks/${artwork.id}`,
        customer_email: req.user.email,
        client_reference_id: artwork.id,
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: artwork.title,
                        description: `By ${artwork.artist.name}`,
                        images: [artwork.imageUrl], // Artwork image URL
                    },
                    unit_amount: artwork.price * 100, // Convert to cents
                },
                quantity: 1,
            },
        ],
    });
    
    // 3) Create pending order in our database
    const order = await Order.create({
        artwork: artwork.id,
        user: req.user.id,
        price: artwork.price,
        paymentStatus: 'pending',
        stripeSessionId: session.id,
    });
    
    // 4) Send response
    res.status(200).json({
        status: 'success',
        sessionId: session.id,
        url: session.url,
    });
});

// Stripe webhook handler (handles checkout completion)
exports.webhookHandler = async (req, res) => {
    const signature = req.headers['stripe-signature'];
    let event;
    
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle checkout session completed event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        // Update order status
        const order = await Order.findOneAndUpdate(
            { stripeSessionId: session.id },
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
            console.error(`Order not found for session: ${session.id}`);
            return res.status(200).end();
        }
        
        // Update artwork as sold
        await Artwork.findByIdAndUpdate(order.artwork._id, { sold: true });
        
        // Send order confirmation email
        try {
            await emailService.sendOrderConfirmationEmail(order, order.user);
        } catch (err) {
            console.error(`Error sending order confirmation email: ${err.message}`);
        }
    }
    
    res.status(200).end();
};

// Update order status (Admin)
exports.updateOrder = catchAsync(async (req, res, next) => {
    // Only allow updating status, shipping details etc. by admin
    const allowedUpdates = { status: req.body.status }; // Add other updatable fields

    const order = await Order.findByIdAndUpdate(req.params.id, allowedUpdates, {
        new: true,
        runValidators: true
    });

    if (!order) {
        return next(new AppError('No order found with that ID', 404));
    }

    // TODO: Send notification email on status change (e.g., shipped)

    res.status(200).json({
        status: 'success',
        data: { order }
    });
}); 