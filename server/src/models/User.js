const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    phone: {
      // Normalized primary identity
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true, // Allows nulls/undefined but enforces uniqueness if present
      unique: true,
    },
    passwordHash: {
      type: String,
      // Optional, as a user could be created purely via OTP auth
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['CUSTOMER', 'ADMIN'],
      default: 'CUSTOMER',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    profileImageUrl: {
      type: String,
      default: null,
    },
    profileImageFileId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
