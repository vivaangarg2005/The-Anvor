/**
 * authRoutes.js
 * Mounts all authentication endpoints under /api/auth.
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

// --- Public ---
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/otp/request', authController.requestOtp);
router.post('/otp/verify', authController.verifyOtp);
router.post('/logout', authController.logout);

// --- Protected ---
router.get('/me', requireAuth, authController.getMe);

module.exports = router;
