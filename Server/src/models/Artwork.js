const mongoose = require('mongoose');

const artworkSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Artwork must have a title'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Artwork must have a description'],
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    artist: {
        type: mongoose.Schema.ObjectId,
        ref: 'User', // Reference to the User model (artist)
        required: [true, 'Artwork must belong to an artist']
    },
    year: {
        type: Number,
        required: [true, 'Artwork must have a year of creation']
    },
    medium: {
        type: String,
        required: [true, 'Artwork must have a medium'],
        trim: true,
        maxlength: [50, 'Medium cannot exceed 50 characters']
    },
    tags: [
        {
            type: String,
            trim: true,
            lowercase: true,
            maxlength: [30, 'Tag cannot exceed 30 characters']
        }
    ],
    image: {
        // Store image URL and potentially a public ID if using cloud storage
        url: {
            type: String,
            required: [true, 'Artwork must have an image URL']
        },
        public_id: String // For Cloudinary or similar for deletion/management
    },
    price: {
        type: Number,
        required: [true, 'Artwork must have a price (set 0 if not for sale)'],
        min: [0, 'Price must be a positive number or zero']
    },
    dimensions: {
        height: Number,
        width: Number,
        depth: Number,
        unit: { type: String, enum: ['cm', 'in', 'px'], default: 'cm' }
    },
    status: {
        type: String,
        enum: ['available', 'sold', 'not_for_sale'],
        default: 'available'
    },
    likesCount: {
        type: Number,
        default: 0
    },
    // We can store who liked it in the User model (favorites) or here.
    // Storing here might be less efficient for user-specific queries but good for counts.
    // likedBy: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],

    // Reference to Gallery/Exhibition if applicable
    gallery: {
        type: mongoose.Schema.ObjectId,
        ref: 'Gallery'
    },
    exhibition: {
        type: mongoose.Schema.ObjectId,
        ref: 'Exhibition'
    },

}, {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true }, // Ensure virtual fields are included in JSON output
    toObject: { virtuals: true } // Ensure virtual fields are included when converting to object
});

// --- Indexes ---
artworkSchema.index({ title: 'text', description: 'text', tags: 'text' }); // For text search
artworkSchema.index({ artist: 1 });
artworkSchema.index({ price: 1 });
artworkSchema.index({ year: 1 });
artworkSchema.index({ medium: 1 });
artworkSchema.index({ tags: 1 });

// --- Virtual Populate --- 
// To show comments associated with an artwork without persisting them in the artwork doc
artworkSchema.virtual('comments', {
    ref: 'Comment',          // The model to use
    foreignField: 'artwork', // The field in the Comment model that links back to Artwork (_id)
    localField: '_id'        // The field in the Artwork model (_id)
});

// --- Middleware ---

// Populate artist details whenever an artwork is found
artworkSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'artist',
        select: 'name email profilePicture' // Select only needed fields
    });
    // Optionally populate gallery/exhibition if needed by default
    // this.populate('gallery');
    // this.populate('exhibition');
    next();
});


const Artwork = mongoose.model('Artwork', artworkSchema);

module.exports = Artwork; 