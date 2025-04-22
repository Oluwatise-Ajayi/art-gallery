const Artwork = require('../models/Artwork');
const User = require('../models/user');
const AppError = require('../utils/appError');

/**
 * Service class for handling artwork-related business logic
 */
class ArtworkService {
  /**
   * Create a new artwork
   * @param {Object} artworkData - The artwork data
   * @param {String} userId - The user ID (artist)
   * @returns {Promise<Object>} - The created artwork
   */
  async createArtwork(artworkData, userId) {
    // Add artist reference
    artworkData.artist = userId;
    
    // Create artwork
    const artwork = await Artwork.create(artworkData);
    
    // Update artist's artworks array
    await User.findByIdAndUpdate(
      userId,
      { $push: { artworks: artwork._id } }
    );
    
    return artwork;
  }
  
  /**
   * Get all artworks with filtering, sorting, pagination
   * @param {Object} queryParams - Query parameters for filtering, sorting, etc.
   * @param {Object} apiFeatures - APIFeatures instance
   * @returns {Promise<Array>} - List of artworks
   */
  async getAllArtworks(queryParams, apiFeatures) {
    // Apply filters, sorting, pagination using APIFeatures
    const features = apiFeatures
      .filter()
      .sort()
      .limitFields()
      .paginate();
      
    // Execute query
    const artworks = await features.query;
    
    return artworks;
  }
  
  /**
   * Get artwork by ID
   * @param {String} id - Artwork ID
   * @returns {Promise<Object>} - The artwork
   * @throws {AppError} - If artwork not found
   */
  async getArtworkById(id) {
    const artwork = await Artwork.findById(id)
      .populate({
        path: 'artist',
        select: 'name bio profilePicture'
      })
      .populate({
        path: 'gallery',
        select: 'name description'
      });
      
    if (!artwork) {
      throw new AppError('Artwork not found', 404);
    }
    
    return artwork;
  }
  
  /**
   * Update artwork
   * @param {String} id - Artwork ID
   * @param {Object} updateData - Data to update
   * @param {String} userId - User ID making the request
   * @returns {Promise<Object>} - Updated artwork
   * @throws {AppError} - If artwork not found or user not authorized
   */
  async updateArtwork(id, updateData, userId) {
    // Check if artwork exists and belongs to the user
    const artwork = await Artwork.findById(id);
    
    if (!artwork) {
      throw new AppError('Artwork not found', 404);
    }
    
    // Check if user is the artist or admin
    if (artwork.artist.toString() !== userId) {
      throw new AppError('You are not authorized to update this artwork', 403);
    }
    
    // Update artwork
    const updatedArtwork = await Artwork.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );
    
    return updatedArtwork;
  }
  
  /**
   * Delete artwork
   * @param {String} id - Artwork ID
   * @param {String} userId - User ID making the request
   * @throws {AppError} - If artwork not found or user not authorized
   */
  async deleteArtwork(id, userId) {
    // Check if artwork exists and belongs to the user
    const artwork = await Artwork.findById(id);
    
    if (!artwork) {
      throw new AppError('Artwork not found', 404);
    }
    
    // Check if user is the artist or admin
    if (artwork.artist.toString() !== userId) {
      throw new AppError('You are not authorized to delete this artwork', 403);
    }
    
    // Remove artwork reference from artist's artworks array
    await User.findByIdAndUpdate(
      artwork.artist,
      { $pull: { artworks: id } }
    );
    
    // Delete artwork
    await Artwork.findByIdAndDelete(id);
  }
  
  /**
   * Add artwork to user's favorites
   * @param {String} artworkId - Artwork ID
   * @param {String} userId - User ID
   * @returns {Promise<Object>} - Updated user
   */
  async addToFavorites(artworkId, userId) {
    // Check if artwork exists
    const artwork = await Artwork.findById(artworkId);
    
    if (!artwork) {
      throw new AppError('Artwork not found', 404);
    }
    
    // Add to favorites if not already added
    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { favorites: artworkId } },
      { new: true }
    );
    
    return user;
  }
  
  /**
   * Remove artwork from user's favorites
   * @param {String} artworkId - Artwork ID
   * @param {String} userId - User ID
   * @returns {Promise<Object>} - Updated user
   */
  async removeFromFavorites(artworkId, userId) {
    // Check if artwork exists
    const artwork = await Artwork.findById(artworkId);
    
    if (!artwork) {
      throw new AppError('Artwork not found', 404);
    }
    
    // Remove from favorites
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { favorites: artworkId } },
      { new: true }
    );
    
    return user;
  }
  
  /**
   * Search artworks
   * @param {String} query - Search query
   * @returns {Promise<Array>} - List of matching artworks
   */
  async searchArtworks(query) {
    const searchRegex = new RegExp(query, 'i');
    
    const artworks = await Artwork.find({
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { medium: searchRegex },
        { tags: searchRegex }
      ]
    }).populate({
      path: 'artist',
      select: 'name'
    });
    
    return artworks;
  }
}

module.exports = new ArtworkService(); 