const Artwork = require('../models/Artwork');
const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/APIFeatures');
const artworkService = require('../services/ArtworkService');
const { uploadArtworkImage, processUploadedFiles } = require('../middleware/uploadMiddleware');

// Placeholder for file upload service (e.g., Cloudinary)
// const uploadService = require('../services/uploadService');

// Get all artworks with filtering, sorting, pagination, and search
exports.getAllArtworks = catchAsync(async (req, res, next) => {
    // Create APIFeatures instance
    const features = new APIFeatures(Artwork.find(), req.query);
    
    // Use service to get artworks with features
    const artworks = await artworkService.getAllArtworks(req.query, features);

    // Send response
    res.status(200).json({
        status: 'success',
        results: artworks.length,
        data: { artworks }
    });
});

// Get a single artwork by ID
exports.getArtwork = catchAsync(async (req, res, next) => {
    const artwork = await artworkService.getArtworkById(req.params.id);

    res.status(200).json({
        status: 'success',
        data: { artwork }
    });
});

// Create a new artwork (Requires Artist or Admin role)
exports.createArtwork = catchAsync(async (req, res, next) => {
    // Image handling is done by middleware (uploadArtworkImage and processUploadedFiles)
    
    // Create artwork using service
    const artwork = await artworkService.createArtwork(req.body, req.user.id);

    res.status(201).json({
        status: 'success',
        data: { artwork }
    });
});

// Update an artwork (Requires owning Artist or Admin role)
exports.updateArtwork = catchAsync(async (req, res, next) => {
    // Update artwork using service
    const artwork = await artworkService.updateArtwork(
        req.params.id,
        req.body,
        req.user.id
    );

    res.status(200).json({
        status: 'success',
        data: { artwork }
    });
});

// Delete an artwork (Requires owning Artist or Admin role)
exports.deleteArtwork = catchAsync(async (req, res, next) => {
    // Delete artwork using service
    await artworkService.deleteArtwork(req.params.id, req.user.id);

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Like an artwork
exports.likeArtwork = catchAsync(async (req, res, next) => {
    // Add to favorites using service
    const user = await artworkService.addToFavorites(req.params.id, req.user.id);
    
    // Get updated artwork to return likes count
    const artwork = await Artwork.findById(req.params.id);

    res.status(200).json({
        status: 'success',
        message: 'Artwork liked',
        data: { 
            likes: artwork.likesCount
        }
    });
});

// Unlike an artwork
exports.unlikeArtwork = catchAsync(async (req, res, next) => {
    // Remove from favorites using service
    const user = await artworkService.removeFromFavorites(req.params.id, req.user.id);
    
    // Get updated artwork to return likes count
    const artwork = await Artwork.findById(req.params.id);

    res.status(200).json({
        status: 'success',
        message: 'Artwork unliked',
        data: { 
            likes: artwork.likesCount
        }
    });
});

// Search artworks
exports.searchArtworks = catchAsync(async (req, res, next) => {
    const { query } = req.params;
    
    // Search artworks using service
    const artworks = await artworkService.searchArtworks(query);
    
    res.status(200).json({
        status: 'success',
        results: artworks.length,
        data: { artworks }
    });
});

// Utility for API Features (Filtering, Sorting, Pagination, Searching)
// This should ideally live in its own file (e.g., utils/apiFeatures.js)
class APIFeatures {
    constructor(query, queryString) {
        this.query = query; // Mongoose query object
        this.queryString = queryString; // req.query object
    }

    filter() {
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
        excludedFields.forEach(el => delete queryObj[el]);

        // Advanced filtering (gte, gt, lte, lt)
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

        this.query = this.query.find(JSON.parse(queryStr));
        return this; // Return the object to allow chaining
    }

    search() {
        if (this.queryString.search) {
            const searchTerm = this.queryString.search;
            // Use $text operator for indexed text search
            this.query = this.query.find({ $text: { $search: searchTerm } });
            // Optional: Add relevance score for sorting
            // this.query = this.query.select({ score: { $meta: "textScore" } });
        }
        return this;
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt'); // Default sort
        }
        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v'); // Exclude __v by default
        }
        return this;
    }

    paginate() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100; // Default limit
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);
        return this;
    }
}

module.exports.APIFeatures = APIFeatures; // Export class if needed elsewhere 