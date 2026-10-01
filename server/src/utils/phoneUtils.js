





const normalizePhone = (phone) => {
  if (!phone) throw new Error("Phone number is required");

  
  
  let normalized = phone.replace(/(?!^\+)\D/g, '');

  
  
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
  
  const regex = /^\+91\d{10}$/;
  return regex.test(normalizedPhone);
};

module.exports = {
  normalizePhone,
  isValidPhone,
};
