/**
 * profileController.js
 *
 * Handles profile photo upload and deletion using ImageKit.
 *
 * Security guarantees:
 * - User identity comes ONLY from req.user.userId (JWT-derived).
 * - The client never supplies a userId or ImageKit fileId.
 * - The private ImageKit key is server-side only.
 * - multer enforces 5 MB size limit and MIME-type validation before upload.
 * - Replacement strategy: upload new → save → attempt old cleanup (non-fatal).
 */

const multer = require("multer");
const User = require("../models/User");

// ── multer: memory storage, 5 MB limit, MIME whitelist ─────────────────────
const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Unsupported file type. Allowed: ${ALLOWED_MIMES.join(", ")}`,
        ),
      );
    }
  },
});

/**
 * Multer middleware wrapper.
 * Intercepts multer errors (type/size) and converts them to 400 responses
 * rather than letting them fall through to the generic 500 error handler.
 */
exports.uploadMiddleware = (req, res, next) => {
  upload.single("photo")(req, res, (err) => {
    if (!err) return next();

    // multer file size exceeded
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({
          success: false,
          error: "File too large. Maximum size is 5 MB.",
        });
    }
    // fileFilter rejection (our MIME check)
    if (err.message && err.message.includes("Unsupported file type")) {
      return res.status(400).json({ success: false, error: err.message });
    }
    // multer unexpected field
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res
        .status(400)
        .json({
          success: false,
          error: 'Unexpected file field. Use field name "photo".',
        });
    }
    // Other multer/unknown errors
    next(err);
  });
};

/**
 * Helper: safely delete an ImageKit file by fileId.
 * Returns true on success, false on failure (non-fatal).
 */
async function safeDeleteImageKitFile(fileId) {
  if (!fileId) return true;
  try {
    // Lazy-load to avoid throwing at module load when env vars are missing
    const imagekit = require("../config/imagekitClient");
    await imagekit.files.deleteFile(fileId);
    return true;
  } catch (err) {
    console.error(
      `[Profile] ImageKit cleanup failed for fileId=${fileId}:`,
      err.message || err,
    );
    return false;
  }
}

/**
 * POST /api/profile/photo
 *
 * Uploads a new profile photo to ImageKit and stores the URL + fileId on the user.
 * If the user already had a photo, the old ImageKit asset is deleted AFTER the
 * new one is safely saved (never deleted before the new one is saved).
 */
exports.uploadPhoto = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // multer already validated type and size; file should be present
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "No image file provided." });
    }

    const imagekit = require("../config/imagekitClient");

    // Determine a stable filename using userId for deduplication
    const ext =
      req.file.mimetype === "image/png"
        ? "png"
        : req.file.mimetype === "image/webp"
          ? "webp"
          : "jpg";
    const fileName = `profile_${userId}.${ext}`;

    // Upload to ImageKit
    const uploadResult = await imagekit.files.upload({
      file: req.file.buffer, // Buffer from multer memoryStorage
      fileName,
      folder: "/anvor/profiles/",
      useUniqueFileName: true, // Force new URL every time to bypass all CDN caching
    });

    const newUrl = uploadResult.url;
    const newFileId = uploadResult.fileId;

    // Fetch current user to get old fileId (if any)
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found." });
    }

    const oldFileId = user.profileImageFileId;

    // Save new image data to DB FIRST before attempting old cleanup
    user.profileImageUrl = newUrl;
    user.profileImageFileId = newFileId;
    await user.save();

    // Now attempt to clean up the old asset (non-fatal)
    if (oldFileId && oldFileId !== newFileId) {
      await safeDeleteImageKitFile(oldFileId);
    }

    return res.status(200).json({
      success: true,
      data: {
        profileImageUrl: newUrl,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/profile/photo
 *
 * Removes the authenticated user's profile photo from ImageKit and clears the DB fields.
 * The fileId to delete is read from the user's own document — never from the client.
 */
exports.deletePhoto = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found." });
    }

    if (!user.profileImageUrl && !user.profileImageFileId) {
      // Idempotent: no photo to delete
      return res
        .status(200)
        .json({ success: true, data: { profileImageUrl: null } });
    }

    const fileId = user.profileImageFileId;

    // Clear DB first so even if ImageKit deletion fails, the URL won't be served
    user.profileImageUrl = null;
    user.profileImageFileId = null;
    await user.save();

    // Attempt ImageKit deletion (non-fatal)
    await safeDeleteImageKitFile(fileId);

    return res
      .status(200)
      .json({ success: true, data: { profileImageUrl: null } });
  } catch (err) {
    next(err);
  }
};
