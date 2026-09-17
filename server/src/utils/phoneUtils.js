/**
 * phoneUtils.js
 * Strictly enforces a consistent phone number format across the entire application.
 * All DB lookups, registrations, and logins must pass through this utility.
 */

const normalizePhone = (phone) => {
  if (!phone) throw new Error("Phone number is required");

  // Remove all non-digit characters (spaces, dashes, parentheses)
  // EXCEPT the leading '+'
  let normalized = phone.replace(/(?!^\+)\D/g, '');

  // If the number doesn't start with '+91', assume it's an Indian number and add it
  // This is a simplified approach for an Indian e-commerce startup. 
  if (!normalized.startsWith('+')) {
    if (normalized.length === 10) {
      normalized = '+91' + normalized;
    } else if (normalized.startsWith('91') && normalized.length === 12) {
      normalized = '+' + normalized;
    } else if (normalized.startsWith('0') && normalized.length === 11) {
      normalized = '+91' + normalized.slice(1);
    } else {
      normalized = '+' + normalized;
    }
  }

  return normalized;
};

const isValidPhone = (normalizedPhone) => {
  // A basic regex for exactly +91 followed by 10 digits.
  const regex = /^\+91\d{10}$/;
  return regex.test(normalizedPhone);
};

module.exports = {
  normalizePhone,
  isValidPhone,
};
