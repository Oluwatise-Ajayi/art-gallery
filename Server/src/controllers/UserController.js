// Placeholder for User Controller (e.g., get profile, update profile)
const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const crypto = require('crypto');
const emailService = require('../services/EmailService');

// Example: Get current user's profile
exports.getMe = (req, res, next) => {
    // User is attached to req.user by the 'protect' middleware
    if (!req.user) {
        return next(new AppError('User not found. This should not happen here.', 404));
    }
    req.params.id = req.user.id; // Set id for getUser function
    next();
};

// Example: Get a specific user by ID (mainly for admin)
exports.getUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id).populate('artworks').populate('favorites');

    if (!user) {
        return next(new AppError('No user found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });
});

// Example: Update current user's profile (non-password data)
exports.updateMe = catchAsync(async (req, res, next) => {
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                'This route is not for password updates. Please use /updateMyPassword.',
                400
            )
        );
    }

    // 2) Filter out unwanted fields names that are not allowed to be updated
    const filteredBody = filterObj(req.body, 'name', 'email', 'bio'); // Add other allowed fields
    // Handle profile picture update separately (upload middleware + service)
    // if (req.file) filteredBody.profilePicture = req.file.path; // Example

    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true, // Return the updated document
        runValidators: true // Run schema validators on update
    });

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });
});

// Example: Delete current user (set active to false)
exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({ // 204 No Content
        status: 'success',
        data: null
    });
});

// --- Utility Functions (Can be moved to utils) ---
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};


// --- Admin Only Functions ---
// These would typically live in AdminController.js or be protected by admin role

exports.getAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.find();

    res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
            users
        }
    });
});

// Do NOT update passwords with this!
exports.updateUser = catchAsync(async (req, res, next) => {
     const user = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!user) {
        return next(new AppError('No user found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
             user
        }
    });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
        return next(new AppError('No user found with that ID', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Password reset functionality
exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on posted email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError('There is no user with that email address.', 404));
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send it to user's email
    try {
        const resetURL = `${req.protocol}://${req.get(
            'host'
        )}/api/v1/users/resetPassword/${resetToken}`;
        
        await emailService.sendPasswordResetEmail(user, resetURL);

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(
            new AppError('There was an error sending the email. Try again later!'),
            500
        );
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on the token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Update changedPasswordAt property for the user
    // This is handled by the pre-save middleware in the User model

    // 4) Log the user in, send JWT
    // TODO: Implement createSendToken or equivalent function
    res.status(200).json({
        status: 'success',
        message: 'Password has been reset successfully. Please log in with your new password.'
    });
});

// Example: Update user password (when logged in)
exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    // 2) Check if posted current password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your current password is incorrect.', 401));
    }

    // 3) If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // User.findByIdAndUpdate will NOT work as intended!

    // 4) Log user in, send JWT
    // TODO: Implement createSendToken or equivalent function
    res.status(200).json({
        status: 'success',
        message: 'Password updated successfully.'
    });
}); 