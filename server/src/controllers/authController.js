/**
 * authController.js
 * Thin HTTP layer. Extracts request data, calls authService, sets cookies.
 */

const authService = require('../services/authService');
const authConfig = require('../config/authConfig');

/**
 * Helper: sets the HttpOnly JWT cookie on the response.
 */
const setTokenCookie = (res, token) => {
  res.cookie(authConfig.cookie.name, token, {
    httpOnly: authConfig.cookie.httpOnly,
    secure: authConfig.cookie.secure,
    sameSite: authConfig.cookie.sameSite,
    maxAge: authConfig.cookie.maxAge,
  });
};

const register = async (req, res, next) => {
  try {
    const { name, phone, email, password } = req.body;
    const result = await authService.registerUser({ name, phone, email, password });

    setTokenCookie(res, result.token);

    res.status(201).json({
      success: true,
      data: result.user,
    });
  } catch (error) { next(error); }
};

const login = async (req, res, next) => {
  try {
    const { phone, email, identifier, password } = req.body;
    const result = await authService.loginWithPassword({ phone, email, identifier, password });

    setTokenCookie(res, result.token);

    res.status(200).json({
      success: true,
      data: result.user,
    });
  } catch (error) { next(error); }
};

const requestOtp = async (req, res, next) => {
  try {
    const { phone, channel } = req.body;
    const result = await authService.requestLoginOtp({ phone, channel });

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) { next(error); }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    const result = await authService.verifyLoginOtp({ phone, otp });

    setTokenCookie(res, result.token);

    res.status(200).json({
      success: true,
      data: result.user,
    });
  } catch (error) { next(error); }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.userId);

    res.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) { next(error); }
};

const logout = async (req, res) => {
  res.clearCookie(authConfig.cookie.name, {
    httpOnly: authConfig.cookie.httpOnly,
    secure: authConfig.cookie.secure,
    sameSite: authConfig.cookie.sameSite,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

module.exports = {
  register,
  login,
  requestOtp,
  verifyOtp,
  getMe,
  logout,
};
