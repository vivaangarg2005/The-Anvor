




const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const otpService = require('./otpService');
const authConfig = require('../config/authConfig');
const { normalizePhone, isValidPhone } = require('../utils/phoneUtils');




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




const issueToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    authConfig.jwt.secret,
    { expiresIn: authConfig.jwt.expiresIn }
  );
};




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
    role: 'CUSTOMER',  
  });

  const token = issueToken(user);

  return { token, user: sanitizeUser(user) };
};




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




const verifyLoginOtp = async ({ phone, otp }) => {
  const normalizedPhone = normalizePhone(phone);

  
  await otpService.verifyOtp({ phone: normalizedPhone, otp, purpose: 'LOGIN' });

  
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

  
  if (!user.phoneVerified) {
    user.phoneVerified = true;
    await user.save();
  }

  const token = issueToken(user);

  return { token, user: sanitizeUser(user) };
};




const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).select('-passwordHash');
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }
  return sanitizeUser(user);
};




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

  
  if (email) {
    const existingEmailUser = await User.findOne({ email });
    if (existingEmailUser) {
      const err = new Error('An account with this email already exists. Please log in normally to link your account.');
      err.statusCode = 409;
      throw err;
    }
  }

  
  const tempToken = jwt.sign(
    { googleId, email, name, picture, purpose: 'GOOGLE_LINK' },
    authConfig.jwt.secret,
    { expiresIn: '15m' }
  );

  return { status: 'NEEDS_PHONE', tempToken, profile: { name, email, picture } };
};




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

  
  await otpService.verifyOtp({ phone: normalizedPhone, otp, purpose: 'LOGIN' });

  
  let user = await User.findOne({ phone: normalizedPhone });

  if (user) {
    
    if (!user.isActive) {
      const err = new Error('This account has been deactivated.');
      err.statusCode = 403;
      throw err;
    }
    
    
    if (user.googleId && user.googleId !== googleId) {
      const err = new Error('This phone number is already linked to a different Google account.');
      err.statusCode = 409;
      throw err;
    }

    user.googleId = googleId;
    user.phoneVerified = true;
    if (!user.profileImageUrl && picture) {
      user.profileImageUrl = picture; 
    }
    await user.save();
  } else {
    
    if (email) {
      const existingEmailUser = await User.findOne({ email });
      if (existingEmailUser) {
        const err = new Error('An account with this email already exists.');
        err.statusCode = 409;
        throw err;
      }
    }

    
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
