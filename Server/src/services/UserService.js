const User = require('../models/user');
const AppError = require('../utils/appError');

/**
 * Service class for handling user-related business logic
 */
class UserService {
  /**
   * Get user by ID
   * @param {String} id - User ID
   * @returns {Promise<Object>} - The user
   * @throws {AppError} - If user not found
   */
  async getUserById(id) {
    const user = await User.findById(id)
      .populate('artworks')
      .populate('favorites');
      
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    return user;
  }
  
  /**
   * Update user profile
   * @param {String} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated user
   */
  async updateProfile(id, updateData) {
    // Update user document
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true, // Return the updated document
        runValidators: true // Run schema validators on update
      }
    );
    
    if (!updatedUser) {
      throw new AppError('User not found', 404);
    }
    
    return updatedUser;
  }
  
  /**
   * Deactivate user account
   * @param {String} id - User ID
   */
  async deactivateAccount(id) {
    const user = await User.findByIdAndUpdate(
      id,
      { active: false }
    );
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
  }
  
  /**
   * Get all users (for admin)
   * @returns {Promise<Array>} - List of users
   */
  async getAllUsers() {
    const users = await User.find();
    return users;
  }
  
  /**
   * Change user password
   * @param {Object} user - User document
   * @param {String} currentPassword - Current password
   * @param {String} newPassword - New password
   * @param {String} passwordConfirm - Confirm new password
   * @returns {Promise<Object>} - Updated user
   * @throws {AppError} - If current password is incorrect or passwords don't match
   */
  async changePassword(user, currentPassword, newPassword, passwordConfirm) {
    // Check if current password is correct
    if (!(await user.correctPassword(currentPassword, user.password))) {
      throw new AppError('Current password is incorrect', 401);
    }
    
    // Validate password confirmation
    if (newPassword !== passwordConfirm) {
      throw new AppError('Passwords do not match', 400);
    }
    
    // Update password
    user.password = newPassword;
    user.passwordConfirm = passwordConfirm;
    await user.save();
    
    return user;
  }
  
  /**
   * Get user's artworks
   * @param {String} userId - User ID
   * @returns {Promise<Array>} - List of artworks
   */
  async getUserArtworks(userId) {
    const user = await User.findById(userId).populate('artworks');
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    return user.artworks;
  }
  
  /**
   * Get user's favorite artworks
   * @param {String} userId - User ID
   * @returns {Promise<Array>} - List of favorite artworks
   */
  async getUserFavorites(userId) {
    const user = await User.findById(userId).populate('favorites');
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    return user.favorites;
  }
  
  /**
   * Filter sensitive data from user object
   * @param {Object} user - User object
   * @returns {Object} - Filtered user object
   */
  filterUserData(user) {
    const filteredUser = { ...user.toObject() };
    
    // Remove sensitive fields
    delete filteredUser.password;
    delete filteredUser.passwordChangedAt;
    delete filteredUser.passwordResetToken;
    delete filteredUser.passwordResetExpires;
    
    return filteredUser;
  }
}

module.exports = new UserService(); 