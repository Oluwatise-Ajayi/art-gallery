const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const AppError = require('../utils/appError');
const emailService = require('./EmailService');

/**
 * Service class for handling authentication-related business logic
 */
class AuthService {
  /**
   * Sign JWT token
   * @param {String} id - User ID
   * @returns {String} - JWT token
   */
  signToken(id) {
    return jwt.sign(
      { id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
  }
  
  /**
   * Create and send JWT token
   * @param {Object} user - User object
   * @param {Number} statusCode - HTTP status code
   * @param {Object} res - Express response object
   */
  createSendToken(user, statusCode, res) {
    const token = this.signToken(user._id);
    
    // Set cookie options
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true
    };
    
    // Set secure flag in production
    if (process.env.NODE_ENV === 'production') {
      cookieOptions.secure = true;
    }
    
    // Set cookie
    res.cookie('jwt', token, cookieOptions);
    
    // Remove password from output
    user.password = undefined;
    
    res.status(statusCode).json({
      status: 'success',
      token,
      data: { user }
    });
  }
  
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} - Created user
   */
  async register(userData) {
    // Create user
    const newUser = await User.create({
      name: userData.name,
      email: userData.email,
      password: userData.password,
      passwordConfirm: userData.passwordConfirm,
      role: userData.role || 'viewer'
    });
    
    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(newUser);
    } catch (err) {
      console.error('Welcome email could not be sent', err);
    }
    
    return newUser;
  }
  
  /**
   * Login user
   * @param {String} email - User email
   * @param {String} password - User password
   * @returns {Promise<Object>} - User
   * @throws {AppError} - If credentials are incorrect
   */
  async login(email, password) {
    // Check if email and password exist
    if (!email || !password) {
      throw new AppError('Please provide email and password', 400);
    }
    
    // Check if user exists and password is correct
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.correctPassword(password, user.password))) {
      throw new AppError('Incorrect email or password', 401);
    }
    
    return user;
  }
  
  /**
   * Protect route - verify JWT token
   * @param {String} token - JWT token
   * @returns {Promise<Object>} - User
   * @throws {AppError} - If token is invalid
   */
  async protectRoute(token) {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      throw new AppError('The user belonging to this token no longer exists', 401);
    }
    
    // Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      throw new AppError('User recently changed password! Please log in again', 401);
    }
    
    return currentUser;
  }
  
  /**
   * Forgot password
   * @param {String} email - User email
   * @param {Function} requestUrl - Function to generate reset URL
   * @returns {Promise<String>} - Reset token
   * @throws {AppError} - If user not found
   */
  async forgotPassword(email, requestUrl) {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('There is no user with that email address', 404);
    }
    
    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    
    // Send email
    try {
      const resetURL = requestUrl(resetToken);
      await emailService.sendPasswordResetEmail(user, resetURL);
      
      return resetToken;
    } catch (err) {
      // If error, reset token and expiry
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      
      throw new AppError('There was an error sending the email. Try again later!', 500);
    }
  }
  
  /**
   * Reset password
   * @param {String} token - Reset token
   * @param {String} password - New password
   * @param {String} passwordConfirm - Confirm new password
   * @returns {Promise<Object>} - User
   * @throws {AppError} - If token is invalid or expired
   */
  async resetPassword(token, password, passwordConfirm) {
    // Hash token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find user by token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });
    
    // Check if token is valid and not expired
    if (!user) {
      throw new AppError('Token is invalid or has expired', 400);
    }
    
    // Update password
    user.password = password;
    user.passwordConfirm = passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    
    return user;
  }
  
  /**
   * Update user password
   * @param {String} userId - User ID
   * @param {String} currentPassword - Current password
   * @param {String} newPassword - New password
   * @param {String} passwordConfirm - Confirm new password
   * @returns {Promise<Object>} - User
   */
  async updatePassword(userId, currentPassword, newPassword, passwordConfirm) {
    // Get user
    const user = await User.findById(userId).select('+password');
    
    // Check current password
    if (!(await user.correctPassword(currentPassword, user.password))) {
      throw new AppError('Your current password is incorrect', 401);
    }
    
    // Update password
    user.password = newPassword;
    user.passwordConfirm = passwordConfirm;
    await user.save();
    
    return user;
  }
}

module.exports = new AuthService(); 