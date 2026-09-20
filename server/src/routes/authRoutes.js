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
router.use(authLimiter); // Apply to all auth routes

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/otp/request", authController.requestOtp);
router.post("/otp/verify", authController.verifyOtp);
router.post("/logout", authController.logout);

// --- Protected ---
router.get("/me", requireAuth, authController.getMe);

module.exports = router;
