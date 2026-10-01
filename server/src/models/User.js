const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    phone: {
      
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true, 
      unique: true,
    },
    passwordHash: {
      type: String,
      
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
