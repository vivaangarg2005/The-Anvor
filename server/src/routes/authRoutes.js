/**
 * authRoutes.js
 * Mounts all authentication endpoints under /api/auth.
 */

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");

const rateLimit = require("express-rate-limit");

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 20 requests per windowMs
  message: {
    success: false,
    error:
      "Too many authentication attempts from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// --- Public ---
router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);
router.post("/otp/request", authLimiter, authController.requestOtp);
router.post("/otp/verify", authLimiter, authController.verifyOtp);
router.post("/google", authLimiter, authController.googleAuth);
router.post("/google/otp", authLimiter, authController.requestGoogleLinkOtp);
router.post("/google/link", authLimiter, authController.googleLinkAuth);
router.post("/logout", authController.logout);

// --- Protected ---
router.get("/me", requireAuth, authController.getMe);

module.exports = router;
