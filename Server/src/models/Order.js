const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    artwork: {
        type: mongoose.Schema.ObjectId,
        ref: 'Artwork',
        required: true
    },
    title: { type: String, required: true }, // Denormalized for easy display
    price: { type: Number, required: true }, // Price at the time of order
    artist: { type: mongoose.Schema.ObjectId, ref: 'User' } // Denormalized artist ref
}, { _id: false });

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Order must belong to a user']
    },
    items: [orderItemSchema], // Array of artworks ordered
    totalAmount: {
        type: Number,
        required: [true, 'Order must have a total amount']
    },
    shippingAddress: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true }
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    paymentDetails: {
        paymentMethod: { type: String, default: 'stripe' }, // e.g., 'stripe', 'paypal'
        paymentStatus: { type: String, enum: ['pending', 'succeeded', 'failed'], default: 'pending' },
        stripePaymentIntentId: String, // Store Stripe Payment Intent ID
        paidAt: Date
    }
}, {
    timestamps: true
});

// --- Indexes ---
orderSchema.index({ user: 1, createdAt: -1 }); // Efficiently query user orders
orderSchema.index({ status: 1 });

// --- Middleware ---
// Optional: Populate user/item details if needed directly on order queries
// orderSchema.pre(/^find/, function(next) {
//     this.populate('user', 'name email');
//     this.populate('items.artwork', 'title image'); // Example population within items
//     next();
// });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order; 