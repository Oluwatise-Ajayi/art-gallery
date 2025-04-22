const express = require('express');
const authRoutes = require('./auth');
const userRoutes = require('./users');
const artworkRoutes = require('./artworks');
const galleryRoutes = require('./galleries');
const exhibitionRoutes = require('./exhibitions');
const commentRoutes = require('./comments');
const orderRoutes = require('./orders');
const adminRoutes = require('./admin');

const router = express.Router();

// Mount feature routers
router.use('/auth', authRoutes);
router.use('/users', userRoutes); // For user profile related actions
router.use('/artworks', artworkRoutes);
router.use('/galleries', galleryRoutes);
router.use('/exhibitions', exhibitionRoutes);
router.use('/comments', commentRoutes); // Could be nested under artworks too
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);


module.exports = router; 