/**
 * profileRoutes.js
 * Mounts profile photo endpoints under /api/profile.
 * All routes require authentication.
 */

const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { requireAuth } = require('../middleware/authMiddleware');

// All profile routes require authentication
router.use(requireAuth);

/**
 * POST /api/profile/photo
 * Upload or replace profile photo.
 * multipart/form-data, field name: "photo"
 */
router.post('/photo', profileController.uploadMiddleware, profileController.uploadPhoto);

/**
 * DELETE /api/profile/photo
 * Remove profile photo.
 */
router.delete('/photo', profileController.deletePhoto);

module.exports = router;
