const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name!'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [8, 'Password must be at least 8 characters long'],
        select: false // Do not include password in query results by default
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            // This only works on CREATE and SAVE!!
            validator: function(el) {
                return el === this.password;
            },
            message: 'Passwords are not the same!'
        }
    },
    role: {
        type: String,
        enum: ['viewer', 'artist', 'admin'],
        default: 'viewer'
    },
    bio: {
        type: String,
        trim: true,
        maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    profilePicture: {
        url: String,
        public_id: String // For Cloudinary or similar
    },
    // For artists: link to their artworks
    artworks: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Artwork'
    }],
    // For viewers: link to their favorites/likes
    favorites: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Artwork'
    }],
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

// --- Mongoose Middleware ---

// Hash password before saving
userSchema.pre('save', async function(next) {
    // Only run this function if password was actually modified
    if (!this.isModified('password')) return next();

    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);

    // Delete passwordConfirm field - no need to persist it
    this.passwordConfirm = undefined;
    next();
});

// Set passwordChangedAt property before saving (if password modified)
userSchema.pre('save', function(next) {
    if (!this.isModified('password') || this.isNew) return next();

    // Subtract 1 second to ensure token is created after password change
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

// Filter out inactive users on find queries
userSchema.pre(/^find/, function(next) {
    // `this` points to the current query
    this.find({ active: { $ne: false } });
    next();
});

// --- Instance Methods ---

// Method to compare candidate password with the user's hashed password
userSchema.methods.correctPassword = async function(
    candidatePassword,
    userPassword
) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

// Method to check if password was changed after the token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );
        // console.log(changedTimestamp, JWTTimestamp);
        return JWTTimestamp < changedTimestamp; // True if changed after token issued
    }
    // False means NOT changed
    return false;
};

// Method to create password reset token
userSchema.methods.createPasswordResetToken = function() {
    // Generate random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token and set to passwordResetToken field
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
        
    // Set expiry (10 minutes)
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    
    // Return unhashed token (to be sent via email)
    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;

