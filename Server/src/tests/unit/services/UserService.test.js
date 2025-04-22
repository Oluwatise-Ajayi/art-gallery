const UserService = require('../../../services/UserService');
const User = require('../../../models/User');
const AppError = require('../../../utils/appError');

// Mock dependencies
jest.mock('../../../models/User');

describe('UserService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should return a user when a valid ID is provided', async () => {
      // Arrange
      const mockUser = {
        _id: '123',
        name: 'Test User',
        email: 'test@example.com',
        toObject: jest.fn().mockReturnValue({
          _id: '123',
          name: 'Test User',
          email: 'test@example.com'
        })
      };
      
      User.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockUser)
        })
      });

      // Act
      const result = await UserService.getUserById('123');

      // Assert
      expect(User.findById).toHaveBeenCalledWith('123');
      expect(result).toEqual(mockUser);
    });

    it('should throw an AppError when user is not found', async () => {
      // Arrange
      User.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        })
      });

      // Act & Assert
      await expect(UserService.getUserById('invalid-id')).rejects.toThrow(AppError);
    });
  });

  describe('updateProfile', () => {
    it('should update and return the user profile', async () => {
      // Arrange
      const userId = '123';
      const updateData = {
        name: 'Updated Name',
        bio: 'Updated bio'
      };
      const mockUpdatedUser = {
        _id: userId,
        name: 'Updated Name',
        email: 'test@example.com',
        bio: 'Updated bio'
      };
      
      User.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

      // Act
      const result = await UserService.updateProfile(userId, updateData);

      // Assert
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        updateData,
        {
          new: true,
          runValidators: true
        }
      );
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should throw an AppError when user is not found', async () => {
      // Arrange
      User.findByIdAndUpdate.mockResolvedValue(null);

      // Act & Assert
      await expect(UserService.updateProfile('invalid-id', {})).rejects.toThrow(AppError);
    });
  });

  describe('deactivateAccount', () => {
    it('should deactivate a user account', async () => {
      // Arrange
      const userId = '123';
      const mockUser = { _id: userId, active: true };
      
      User.findByIdAndUpdate.mockResolvedValue(mockUser);

      // Act
      await UserService.deactivateAccount(userId);

      // Assert
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { active: false }
      );
    });

    it('should throw an AppError when user is not found', async () => {
      // Arrange
      User.findByIdAndUpdate.mockResolvedValue(null);

      // Act & Assert
      await expect(UserService.deactivateAccount('invalid-id')).rejects.toThrow(AppError);
    });
  });

  describe('filterUserData', () => {
    it('should remove sensitive fields from user object', () => {
      // Arrange
      const mockUser = {
        _id: '123',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
        passwordChangedAt: new Date(),
        passwordResetToken: 'token',
        passwordResetExpires: new Date(),
        toObject: jest.fn().mockReturnValue({
          _id: '123',
          name: 'Test User',
          email: 'test@example.com',
          password: 'hashed_password',
          passwordChangedAt: new Date(),
          passwordResetToken: 'token',
          passwordResetExpires: new Date()
        })
      };

      // Act
      const result = UserService.filterUserData(mockUser);

      // Assert
      expect(result).toHaveProperty('_id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('email');
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('passwordChangedAt');
      expect(result).not.toHaveProperty('passwordResetToken');
      expect(result).not.toHaveProperty('passwordResetExpires');
    });
  });
}); 