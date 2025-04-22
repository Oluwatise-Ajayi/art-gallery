const mongoose = require('mongoose');

const exhibitionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'An exhibition must have a title'],
        trim: true,
        unique: true,
        maxlength: [150, 'Exhibition title cannot exceed 150 characters']
    },
    description: {
        type: String,
        trim: true,
        required: [true, 'Exhibition must have a description'],
        maxlength: [2000, 'Exhibition description cannot exceed 2000 characters']
    },
    startDate: {
        type: Date,
        required: [true, 'Exhibition must have a start date']
    },
    endDate: {
        type: Date,
        required: [true, 'Exhibition must have an end date'],
        validate: {
            validator: function(endDate) {
                // `this` refers to the document being validated
                return endDate > this.startDate;
            },
            message: 'End date must be after start date'
        }
    },
    // Featured artworks for this specific exhibition
    featuredArtworks: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Artwork'
    }],
    // Could be a gallery ID if the exhibition takes place within a specific virtual gallery space
    gallery: {
        type: mongoose.Schema.ObjectId,
        ref: 'Gallery'
    },
    // Curator(s) for the exhibition (Admin or specific User role)
    curators: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'past'],
        default: 'upcoming'
        // Could be dynamically determined based on dates, or manually set
    },
    // Optional: Virtual tour link, theme, etc.
    theme: String,
    virtualTourLink: String,
    featuredImage: {
        url: String,
        public_id: String
    }
}, {
    timestamps: true
});

// Index for querying by date range
exhibitionSchema.index({ startDate: 1, endDate: 1 });

// Optional: Middleware to update status based on dates automatically?
// exhibitionSchema.pre('save', function(next) {
//     const now = new Date();
//     if (this.startDate > now) {
//         this.status = 'upcoming';
//     } else if (this.endDate < now) {
//         this.status = 'past';
//     } else {
//         this.status = 'ongoing';
//     }
//     next();
// });

const Exhibition = mongoose.model('Exhibition', exhibitionSchema);

module.exports = Exhibition; 