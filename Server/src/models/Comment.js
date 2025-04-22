const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    text: {
        type: String,
        required: [true, 'Comment cannot be empty'],
        trim: true,
        maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    artwork: {
        type: mongoose.Schema.ObjectId,
        ref: 'Artwork',
        required: [true, 'Comment must belong to an artwork']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Comment must belong to a user']
    }
}, {
    timestamps: true
});

// --- Indexes ---
commentSchema.index({ artwork: 1, createdAt: -1 }); // Efficiently query comments for an artwork, sorted by newest
commentSchema.index({ user: 1 });

// --- Middleware ---

// Populate user details when finding comments
commentSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'user',
        select: 'name profilePicture' // Select only needed fields
    });
    // Avoid populating artwork details here if comments are typically fetched via the artwork itself
    // (using the virtual populate on the Artwork model)
    // this.populate('artwork'); 
    next();
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment; 