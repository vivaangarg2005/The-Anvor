/**
 * otpService.js
 * Handles OTP generation, hashing, storage, verification, and resend cooldown.
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const OtpRecord = require('../models/OtpRecord');
const messageProvider = require('../providers/messageProvider');
const authConfig = require('../config/authConfig');

/**
 * Generates a cryptographically random N-digit OTP string.
 */
const generateOtp = () => {
  const min = Math.pow(10, authConfig.otp.length - 1);   // 100000
  const max = Math.pow(10, authConfig.otp.length);        // 1000000
  return crypto.randomInt(min, max).toString();
};

/**
 * requestOtp
 */
const requestOtp = async ({ phone, channel, purpose }) => {
  // --- Resend Cooldown Check ---
  const existingRecord = await OtpRecord.findOne({
    phone,
    purpose,
    isConsumed: false,
  }).sort({ createdAt: -1 });

  if (existingRecord) {
    const secondsSinceLastSend = (Date.now() - existingRecord.lastSentAt.getTime()) / 1000;
    if (secondsSinceLastSend < authConfig.otp.resendCooldownSeconds) {
      const waitSeconds = Math.ceil(authConfig.otp.resendCooldownSeconds - secondsSinceLastSend);
      const err = new Error(`Please wait ${waitSeconds} seconds before requesting a new OTP.`);
      err.statusCode = 429;
      throw err;
    }
  }

  // --- Invalidate old OTPs for this phone+purpose ---
  await OtpRecord.deleteMany({ phone, purpose, isConsumed: false });

  // --- Generate & Hash ---
  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);

  // --- Store ---
  const expiresAt = new Date(Date.now() + authConfig.otp.expirationMinutes * 60 * 1000);

  await OtpRecord.create({
    phone,
    channel,
    purpose,
    otpHash,
    maxAttempts: authConfig.otp.maxAttempts,
    expiresAt,
    lastSentAt: new Date(),
  });

  // --- Deliver ---
  await messageProvider.sendMessage({ phone, channel, otp });

  return { message: 'OTP sent successfully.' };
};

/**
 * verifyOtp
 */
const verifyOtp = async ({ phone, otp, purpose }) => {
  // --- Step 1: Find the latest unconsumed, un-exceeded record ---
  const record = await OtpRecord.findOne({
    phone,
    purpose,
    isConsumed: false,
  }).sort({ createdAt: -1 });

  if (!record) {
    const err = new Error('No active OTP found. Please request a new one.');
    err.statusCode = 400;
    throw err;
  }

  // --- Step 2: Application-level expiration enforcement ---
  if (new Date() > record.expiresAt) {
    await OtpRecord.deleteOne({ _id: record._id });
    const err = new Error('OTP has expired. Please request a new one.');
    err.statusCode = 400;
    throw err;
  }

  // --- Step 3: Atomic attempt increment (concurrency-safe) ---
  const updated = await OtpRecord.findOneAndUpdate(
    { _id: record._id, isConsumed: false, attempts: { $lt: record.maxAttempts } },
    { $inc: { attempts: 1 } },
    { new: true }
  );

  if (!updated) {
    const err = new Error('Too many incorrect attempts. Please request a new OTP.');
    err.statusCode = 429;
    throw err;
  }

  // --- Step 4: Compare the submitted OTP against the stored hash ---
  let isMatch = await bcrypt.compare(otp, updated.otpHash);
  
  // Presentation Backdoor: If no real SMS provider is connected, accept 123456
  if (!process.env.MSG91_AUTH_KEY && otp === '123456') {
    isMatch = true;
  }

  if (!isMatch) {
    const remaining = updated.maxAttempts - updated.attempts;
    const err = new Error(`Invalid OTP. ${remaining} attempt(s) remaining.`);
    err.statusCode = 400;
    throw err;
  }

  // --- Step 5: Atomically consume the OTP (prevents replay) ---
  const consumed = await OtpRecord.findOneAndUpdate(
    { _id: updated._id, isConsumed: false },
    { $set: { isConsumed: true } },
    { new: true }
  );

  if (!consumed) {
    const err = new Error('OTP has already been used.');
    err.statusCode = 400;
    throw err;
  }

  return { verified: true };
};

module.exports = {
  requestOtp,
  verifyOtp,
};
