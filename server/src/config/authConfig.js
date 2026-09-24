/**
 * authConfig.js
 * Centralized, configurable security values for the authentication system.
 */

module.exports = {
  otp: {
    length: 6,                    // 6-digit OTP
    expirationMinutes: 5,         // OTP expires after 5 minutes
    maxAttempts: 5,               // Max incorrect verification attempts
    resendCooldownSeconds: 60,    // Must wait 60s between OTP requests
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '7d',              // Token valid for 7 days
  },
  cookie: {
    name: 'anvor_token',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', // 'none' is required when frontend and backend are on completely different domains (like vercel.app and onrender.com)
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  },
  password: {
    minLength: 8,
    saltRounds: 12,               // bcrypt cost factor
  },
};
