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




const getAddresses = async (userId) => {
  return Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });
};




const createAddress = async (userId, data) => {
  validateAddressData(data);

  const addressCount = await Address.countDocuments({ user: userId });
  
  
  const isDefault = data.isDefault || addressCount === 0;

  if (isDefault && addressCount > 0) {
    
    await Address.updateMany({ user: userId }, { $set: { isDefault: false } });
  }

  const address = new Address({
    ...data,
    user: userId,
    isDefault,
  });

  return address.save();
};




const updateAddress = async (userId, addressId, data) => {
  validateAddressData(data);

  const address = await Address.findOne({ _id: addressId, user: userId });
  if (!address) {
    throw new Error('Address not found');
  }

  
  if (data.isDefault && !address.isDefault) {
    await Address.updateMany(
      { user: userId, _id: { $ne: addressId } },
      { $set: { isDefault: false } }
    );
  }

  
  Object.assign(address, data);
  return address.save();
};




const deleteAddress = async (userId, addressId) => {
  const address = await Address.findOne({ _id: addressId, user: userId });
  if (!address) {
    throw new Error('Address not found');
  }

  const wasDefault = address.isDefault;
  await address.deleteOne();

  
  if (wasDefault) {
    const latestAddress = await Address.findOne({ user: userId }).sort({ createdAt: -1 });
    if (latestAddress) {
      latestAddress.isDefault = true;
      await latestAddress.save();
    }
  }

  return true;
};




const setDefaultAddress = async (userId, addressId) => {
  const address = await Address.findOne({ _id: addressId, user: userId });
  if (!address) {
    throw new Error('Address not found');
  }

  if (address.isDefault) {
    return address; 
  }

  
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