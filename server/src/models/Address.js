const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipientName: {
      type: String,
      required: [true, 'Recipient name is required'],
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      maxlength: 20,
    },
    addressLine1: {
      type: String,
      required: [true, 'Address Line 1 is required'],
      trim: true,
      maxlength: 255,
    },
    addressLine2: {
      type: String,
      trim: true,
      maxlength: 255,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: 100,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      maxlength: 100,
    },
    postalCode: {
      type: String,
      required: [true, 'Postal Code is required'],
      trim: true,
      maxlength: 20,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      maxlength: 100,
      default: 'India',
    },
    landmark: {
      type: String,
      trim: true,
      maxlength: 255,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Address', addressSchema);