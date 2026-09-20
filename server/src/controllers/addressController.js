const addressService = require('../services/addressService');

const getAddresses = async (req, res, next) => {
  try {
    const addresses = await addressService.getAddresses(req.user.userId);
    res.status(200).json({ success: true, data: addresses });
  } catch (error) {
    next(error);
  }
};

const createAddress = async (req, res, next) => {
  try {
    const { recipientName, phone, addressLine1, addressLine2, city, state, postalCode, country, landmark, isDefault } = req.body;
    
    // Whitelist input to avoid mass-assignment
    const addressData = {
      recipientName, phone, addressLine1, addressLine2, city, state, postalCode, country, landmark, isDefault
    };

    const address = await addressService.createAddress(req.user.userId, addressData);
    res.status(201).json({ success: true, data: address });
  } catch (error) {
    next(error);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const { recipientName, phone, addressLine1, addressLine2, city, state, postalCode, country, landmark, isDefault } = req.body;
    
    const addressData = {
      recipientName, phone, addressLine1, addressLine2, city, state, postalCode, country, landmark, isDefault
    };

    // Remove undefined fields so they don't overwrite with null
    Object.keys(addressData).forEach(key => addressData[key] === undefined && delete addressData[key]);

    const address = await addressService.updateAddress(req.user.userId, req.params.id, addressData);
    res.status(200).json({ success: true, data: address });
  } catch (error) {
    if (error.message === 'Address not found') {
      return res.status(404).json({ success: false, error: 'Address not found or unauthorized' });
    }
    next(error);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    await addressService.deleteAddress(req.user.userId, req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    if (error.message === 'Address not found') {
      return res.status(404).json({ success: false, error: 'Address not found or unauthorized' });
    }
    next(error);
  }
};

const setDefaultAddress = async (req, res, next) => {
  try {
    const address = await addressService.setDefaultAddress(req.user.userId, req.params.id);
    res.status(200).json({ success: true, data: address });
  } catch (error) {
    if (error.message === 'Address not found') {
      return res.status(404).json({ success: false, error: 'Address not found or unauthorized' });
    }
    next(error);
  }
};

module.exports = {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};