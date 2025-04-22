const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A gallery must have a name'],
        trim: true,
        unique: true,
        maxlength: [100, 'Gallery name cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Gallery description cannot exceed 1000 characters']
    },
    // A gallery is a collection of artworks
    artworks: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Artwork'
    }],
    // Optional: Assign a curator (Admin or specific User role)
    curator: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    // Optional: Featured image for the gallery
    featuredImage: {
        url: String,
        public_id: String
    }
}, {
    timestamps: true
});

// Optional: Middleware to ensure curator has the correct role if needed

const Gallery = mongoose.model('Gallery', gallerySchema);

module.exports = Gallery; 