const Address = require('../models/Address');
const { normalizePhone, isValidPhone } = require('../utils/phoneUtils');

const validateAddressData = (data) => {
  if (data.phone) {
    try {
      data.phone = normalizePhone(data.phone);
    } catch (error) {
      const err = new Error(error.message);
      err.statusCode = 400;
      throw err;
    }
    if (!isValidPhone(data.phone)) {
      const err = new Error('Invalid phone number format');
      err.statusCode = 400;
      throw err;
    }
  }

  if (data.country && data.postalCode) {
    if (data.country.trim().toLowerCase() === 'india') {
      const pinRegex = /^\d{6}$/;
      if (!pinRegex.test(data.postalCode)) {
        const err = new Error('Postal code for India must be exactly 6 digits');
        err.statusCode = 400;
        throw err;
      }
    }
  }
};

/**
 * Get all addresses for a user
 */
const getAddresses = async (userId) => {
  return Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });
};

/**
 * Create a new address for a user
 */
const createAddress = async (userId, data) => {
  validateAddressData(data);

  const addressCount = await Address.countDocuments({ user: userId });
  
  // If this is the first address, make it default automatically
  const isDefault = data.isDefault || addressCount === 0;

  if (isDefault && addressCount > 0) {
    // Unset any existing default
    await Address.updateMany({ user: userId }, { $set: { isDefault: false } });
  }

  const address = new Address({
    ...data,
    user: userId,
    isDefault,
  });

  return address.save();
};

/**
 * Update an existing address
 */
const updateAddress = async (userId, addressId, data) => {
  validateAddressData(data);

  const address = await Address.findOne({ _id: addressId, user: userId });
  if (!address) {
    throw new Error('Address not found');
  }

  // If setting this address to default, unset others
  if (data.isDefault && !address.isDefault) {
    await Address.updateMany(
      { user: userId, _id: { $ne: addressId } },
      { $set: { isDefault: false } }
    );
  }

  // Update fields
  Object.assign(address, data);
  return address.save();
};

/**
 * Delete an address
 */
const deleteAddress = async (userId, addressId) => {
  const address = await Address.findOne({ _id: addressId, user: userId });
  if (!address) {
    throw new Error('Address not found');
  }

  const wasDefault = address.isDefault;
  await address.deleteOne();

  // If we deleted the default address, and there are other addresses, make the most recent one default
  if (wasDefault) {
    const latestAddress = await Address.findOne({ user: userId }).sort({ createdAt: -1 });
    if (latestAddress) {
      latestAddress.isDefault = true;
      await latestAddress.save();
    }
  }

  return true;
};

/**
 * Set an address as default
 */
const setDefaultAddress = async (userId, addressId) => {
  const address = await Address.findOne({ _id: addressId, user: userId });
  if (!address) {
    throw new Error('Address not found');
  }

  if (address.isDefault) {
    return address; // Already default
  }

  // Unset previous defaults
  await Address.updateMany(
    { user: userId, _id: { $ne: addressId } },
    { $set: { isDefault: false } }
  );

  address.isDefault = true;
  return address.save();
};

module.exports = {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};