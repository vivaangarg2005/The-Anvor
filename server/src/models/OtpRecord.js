const mongoose = require('mongoose');

const otpRecordSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ['WHATSAPP', 'SMS'],
      required: true,
    },
    purpose: {
      type: String,
      enum: ['LOGIN', 'PHONE_VERIFICATION', 'CHANGE_PHONE', 'PASSWORD_RESET'],
      required: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    isConsumed: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      // MongoDB will automatically delete the document once this date is passed
      index: { expires: '0' } 
    },
    lastSentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OtpRecord', otpRecordSchema);
