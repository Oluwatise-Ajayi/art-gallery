const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { signToken } = require('../utils/jwtUtils');

// Utility to send JWT response
const createSendToken = (user, statusCode, req, res) => {
    const token = signToken(user._id);

    // Cookie options (consider security flags in production)
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000 // Convert days to ms
        ),
        httpOnly: true, // Prevent XSS by not allowing JS access
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https' // Only send over HTTPS
    };
    // if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    
    // Remove password from output
    user.password = undefined; 

    // Send cookie (optional, depends on frontend auth strategy)
    // res.cookie('jwt', token, cookieOptions); 

    res.status(statusCode).json({
        status: 'success',
        token, // Send token in response body as well
        data: {
            user
        }
    });
};

// Controller for user signup (registration)
exports.signup = catchAsync(async (req, res, next) => {
    // Create user with only allowed fields (prevent role injection etc.)
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        role: req.body.role // Consider if users should select role at signup or if it's assigned later
        // Add other fields like bio if applicable during signup
    });

    // Automatically log in the user after signup
    createSendToken(newUser, 201, req, res); // 201 Created
});

// Controller for user login
exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password!', 400));
    }

    // 2) Check if user exists && password is correct
    // Use +password to explicitly select the password field which is select: false in the model
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401)); // 401 Unauthorized
    }

    // 3) If everything ok, send token to client
    createSendToken(user, 200, req, res); // 200 OK
});

// Controller for user logout (Placeholder - depends on strategy)
exports.logout = (req, res) => {
    // If using cookies: Clear the cookie
    // res.cookie('jwt', 'loggedout', {
    //     expires: new Date(Date.now() + 10 * 1000), // Expire in 10 seconds
    //     httpOnly: true
    // });

    // Client-side token handling: The client should simply discard the token.
    // Server doesn't necessarily need to do anything unless maintaining a blacklist.
    res.status(200).json({ status: 'success' });
}; 