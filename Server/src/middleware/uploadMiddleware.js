const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const AppError = require('../utils/appError');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Check file type
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'art-gallery',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit' }]
  }
});

// Setup multer upload for different use cases
const artworkUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Middleware for single artwork image upload
exports.uploadArtworkImage = artworkUpload.single('image');

// Middleware for multiple artwork images (for galleries or collections)
exports.uploadMultipleImages = artworkUpload.array('images', 10); // Max 10 images

// Middleware to handle upload errors
exports.handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('Image too large! Maximum size is 5MB.', 400));
    }
    return next(new AppError(`Upload error: ${err.message}`, 400));
  }
  next(err);
};

// Middleware to add upload data to req.body and clean up
exports.processUploadedFiles = (req, res, next) => {
  if (!req.file && !req.files) return next();
  
  // For single file upload
  if (req.file) {
    req.body.imageUrl = req.file.path;
    req.body.imagePublicId = req.file.filename;
  }
  
  // For multiple files upload
  if (req.files && req.files.length > 0) {
    req.body.images = req.files.map(file => ({
      url: file.path,
      publicId: file.filename
    }));
  }
  
  next();
}; 