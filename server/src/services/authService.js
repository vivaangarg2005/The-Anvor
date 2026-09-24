/**
 * authService.js
 * Centralized authentication business logic.
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const otpService = require('./otpService');
const authConfig = require('../config/authConfig');
const { normalizePhone, isValidPhone } = require('../utils/phoneUtils');

/**
 * Safely returns user fields that are appropriate for API responses.
 */
const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  phone: user.phone,
  email: user.email || null,
  phoneVerified: user.phoneVerified,
  role: user.role,
  isActive: user.isActive,
  profileImageUrl: user.profileImageUrl || null,
  createdAt: user.createdAt,
});

/**
 * Issues a signed JWT containing only the userId and role.
 */
const issueToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    authConfig.jwt.secret,
    { expiresIn: authConfig.jwt.expiresIn }
  );
};

/**
 * registerUser
 */
const registerUser = async ({ name, phone, email, password }) => {
  const normalizedPhone = normalizePhone(phone);
  if (!isValidPhone(normalizedPhone)) {
    const err = new Error('Invalid phone number format. Expected 10-digit Indian number.');
    err.statusCode = 400;
    throw err;
  }

  if (!name || name.trim().length === 0) {
    const err = new Error('Name is required.');
    err.statusCode = 400;
    throw err;
  }

  if (!password || password.length < authConfig.password.minLength) {
    const err = new Error(`Password must be at least ${authConfig.password.minLength} characters.`);
    err.statusCode = 400;
    throw err;
  }

  // Check if user already exists
  const existingUser = await User.findOne({ phone: normalizedPhone });
  if (existingUser) {
    const err = new Error('An account with this phone number already exists.');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, authConfig.password.saltRounds);

  const user = await User.create({
    name: name.trim(),
    phone: normalizedPhone,
    email: email ? email.trim().toLowerCase() : undefined,
    passwordHash,
    role: 'CUSTOMER',  // FORCED
  });

  const token = issueToken(user);

  return { token, user: sanitizeUser(user) };
};

/**
 * loginWithPassword
 */
const loginWithPassword = async ({ phone, email, identifier, password }) => {
  const inputIdentifier = (identifier || phone || email || '').trim();
  if (!inputIdentifier) {
    const err = new Error('Phone number or email is required.');
    err.statusCode = 400;
    throw err;
  }

  let user;
  if (inputIdentifier.includes('@')) {
    user = await User.findOne({ email: inputIdentifier.toLowerCase() });
  } else {
    let searchPhone = inputIdentifier;
    try {
      if (isValidPhone(normalizePhone(inputIdentifier))) {
        searchPhone = normalizePhone(inputIdentifier);
      }
    } catch {
      // ignore
    }
    user = await User.findOne({
      $or: [
        { phone: searchPhone },
        { email: inputIdentifier.toLowerCase() }
      ]
    });
  }

  if (!user || !user.passwordHash) {
    const err = new Error('Invalid credentials.');
    err.statusCode = 401;
    throw err;
  }

  if (!user.isActive) {
    const err = new Error('This account has been deactivated.');
    err.statusCode = 403;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const err = new Error('Invalid credentials.');
    err.statusCode = 401;
    throw err;
  }

  const token = issueToken(user);

  return { token, user: sanitizeUser(user) };
};

/**
 * requestLoginOtp
 */
const requestLoginOtp = async ({ phone, channel }) => {
  const normalizedPhone = normalizePhone(phone);
  if (!isValidPhone(normalizedPhone)) {
    const err = new Error('Invalid phone number format.');
    err.statusCode = 400;
    throw err;
  }

  const validChannels = ['WHATSAPP', 'SMS'];
  if (!validChannels.includes(channel)) {
    const err = new Error('Invalid channel. Use WHATSAPP or SMS.');
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findOne({ phone: normalizedPhone });

  if (user && user.isActive) {
    await otpService.requestOtp({ phone: normalizedPhone, channel, purpose: 'LOGIN' });
  }

  return { message: 'If an account exists with this number, an OTP has been sent.' };
};

/**
 * requestGoogleLinkOtp
 */
const requestGoogleLinkOtp = async ({ tempToken, phone, channel }) => {
  let decoded;
  try {
    decoded = jwt.verify(tempToken, authConfig.jwt.secret);
  } catch (err) {
    const error = new Error('Invalid or expired Google session.');
    error.statusCode = 401;
    throw error;
  }
  
  if (decoded.purpose !== 'GOOGLE_LINK') {
    const err = new Error('Invalid token purpose.');
    err.statusCode = 400;
    throw err;
  }

  const normalizedPhone = normalizePhone(phone);
  if (!isValidPhone(normalizedPhone)) {
    const err = new Error('Invalid phone number format.');
    err.statusCode = 400;
    throw err;
  }

  const validChannels = ['WHATSAPP', 'SMS'];
  if (!validChannels.includes(channel)) {
    const err = new Error('Invalid channel.');
    err.statusCode = 400;
    throw err;
  }

  await otpService.requestOtp({ phone: normalizedPhone, channel, purpose: 'LOGIN' });

  return { message: 'OTP sent.' };
};

/**
 * verifyLoginOtp
 */
const verifyLoginOtp = async ({ phone, otp }) => {
  const normalizedPhone = normalizePhone(phone);

  // Verify the OTP first
  await otpService.verifyOtp({ phone: normalizedPhone, otp, purpose: 'LOGIN' });

  // Look up the user by normalized phone
  const user = await User.findOne({ phone: normalizedPhone });

  if (!user) {
    const err = new Error('No account found for this phone number.');
    err.statusCode = 404;
    throw err;
  }

  if (!user.isActive) {
    const err = new Error('This account has been deactivated.');
    err.statusCode = 403;
    throw err;
  }

  // --- Identity Continuity ---
  if (!user.phoneVerified) {
    user.phoneVerified = true;
    await user.save();
  }

  const token = issueToken(user);

  return { token, user: sanitizeUser(user) };
};

/**
 * getCurrentUser
 */
const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).select('-passwordHash');
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }
  return sanitizeUser(user);
};

/**
 * googleAuth
 */
const googleAuth = async ({ credential }) => {
  if (!credential) {
    const err = new Error('Google credential is required.');
    err.statusCode = 400;
    throw err;
  }

  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  const googleId = payload.sub;
  const email = payload.email;
  const name = payload.name;
  const picture = payload.picture;

  let user = await User.findOne({ googleId });

  if (user) {
    if (!user.isActive) {
      const err = new Error('This account has been deactivated.');
      err.statusCode = 403;
      throw err;
    }
    return { status: 'SUCCESS', token: issueToken(user), user: sanitizeUser(user) };
  }

  // Check if a user exists with this email but without googleId
  if (email) {
    const existingEmailUser = await User.findOne({ email });
    if (existingEmailUser) {
      const err = new Error('An account with this email already exists. Please log in normally to link your account.');
      err.statusCode = 409;
      throw err;
    }
  }

  // If no user exists, issue a temporary signed token for the frontend to proceed with phone verification
  const tempToken = jwt.sign(
    { googleId, email, name, picture, purpose: 'GOOGLE_LINK' },
    authConfig.jwt.secret,
    { expiresIn: '15m' }
  );

  return { status: 'NEEDS_PHONE', tempToken, profile: { name, email, picture } };
};

/**
 * googleLinkAuth
 */
const googleLinkAuth = async ({ tempToken, phone, otp }) => {
  let decoded;
  try {
    decoded = jwt.verify(tempToken, authConfig.jwt.secret);
  } catch (err) {
    const error = new Error('Invalid or expired Google session. Please try again.');
    error.statusCode = 401;
    throw error;
  }

  if (decoded.purpose !== 'GOOGLE_LINK') {
    const err = new Error('Invalid token purpose.');
    err.statusCode = 400;
    throw err;
  }

  const { googleId, email, name, picture } = decoded;

  const normalizedPhone = normalizePhone(phone);
  if (!isValidPhone(normalizedPhone)) {
    const err = new Error('Invalid phone number format.');
    err.statusCode = 400;
    throw err;
  }

  // Verify the OTP
  await otpService.verifyOtp({ phone: normalizedPhone, otp, purpose: 'LOGIN' });

  // Check if phone already used by another account
  let user = await User.findOne({ phone: normalizedPhone });

  if (user) {
    // If the account exists, link it
    if (!user.isActive) {
      const err = new Error('This account has been deactivated.');
      err.statusCode = 403;
      throw err;
    }
    
    // Safety check: ensure the account doesn't belong to another Google user
    if (user.googleId && user.googleId !== googleId) {
      const err = new Error('This phone number is already linked to a different Google account.');
      err.statusCode = 409;
      throw err;
    }

    user.googleId = googleId;
    user.phoneVerified = true;
    if (!user.profileImageUrl && picture) {
      user.profileImageUrl = picture; // Do not overwrite existing profile photo
    }
    await user.save();
  } else {
    // Check if email already used
    if (email) {
      const existingEmailUser = await User.findOne({ email });
      if (existingEmailUser) {
        const err = new Error('An account with this email already exists.');
        err.statusCode = 409;
        throw err;
      }
    }

    // Create the new user
    user = await User.create({
      name: name || 'Google User',
      phone: normalizedPhone,
      email: email ? email.toLowerCase() : undefined,
      googleId,
      phoneVerified: true,
      role: 'CUSTOMER',
      profileImageUrl: picture || null,
    });
  }

  const token = issueToken(user);
  return { token, user: sanitizeUser(user) };
};

module.exports = {
  registerUser,
  loginWithPassword,
  requestLoginOtp,
  verifyLoginOtp,
  getCurrentUser,
  googleAuth,
  requestGoogleLinkOtp,
  googleLinkAuth,
};
