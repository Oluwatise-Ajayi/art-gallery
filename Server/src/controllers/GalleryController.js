// Placeholder for Gallery Controller
const Gallery = require('../models/Gallery');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getAllGalleries = catchAsync(async (req, res, next) => {
    // TODO: Implement Filtering/Pagination
    const galleries = await Gallery.find().populate('artworks', 'title image'); // Populate basic artwork info

    res.status(200).json({
        status: 'success',
        results: galleries.length,
        data: { galleries }
    });
});

exports.getGallery = catchAsync(async (req, res, next) => {
    const gallery = await Gallery.findById(req.params.id).populate('artworks'); // Populate full artwork details

    if (!gallery) {
        return next(new AppError('No gallery found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: { gallery }
    });
});

exports.createGallery = catchAsync(async (req, res, next) => {
    // Only allow admins to create galleries
    const newGallery = await Gallery.create(req.body);

    res.status(201).json({
        status: 'success',
        data: { gallery: newGallery }
    });
});

exports.updateGallery = catchAsync(async (req, res, next) => {
    const gallery = await Gallery.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!gallery) {
        return next(new AppError('No gallery found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: { gallery }
    });
});

exports.deleteGallery = catchAsync(async (req, res, next) => {
    const gallery = await Gallery.findByIdAndDelete(req.params.id);

    if (!gallery) {
        return next(new AppError('No gallery found with that ID', 404));
    }

    // TODO: Decide if deleting a gallery should delete associated artworks or just remove the reference

    res.status(204).json({
        status: 'success',
        data: null
    });
}); 