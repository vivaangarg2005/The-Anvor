/**
 * profileController.js
 *
 * Handles profile photo upload and deletion using ImageKit.
 *
 * Security & Lifecycle guarantees:
 * - User identity comes ONLY from req.user.userId (JWT-derived).
 * - The client never supplies a userId or ImageKit fileId.
 * - The private ImageKit key is server-side only.
 * - multer enforces 5 MB size limit and MIME-type validation before upload.
 * - Replacement strategy:
 *   1. Read existing user's old profileImageFileId.
 *   2. Upload new cropped image to ImageKit with useUniqueFileName: true.
 *   3. Save new image URL + fileId to MongoDB.
 *   4. Return HTTP 200 immediately to the client (non-blocking).
 *   5. Trigger background async deletion of old ImageKit file via setImmediate().
 *   6. If MongoDB update fails after upload: attempt cleanup of newly uploaded asset,
 *      do not alter user's existing DB reference, and return server error.
 * - Removal strategy:
 *   1. Read current user's profileImageFileId.
 *   2. If no photo exists, return 200 idempotently.
 *   3. Delete ImageKit asset using exact stored fileId. If deletion fails, return error and
 *      do not clear DB.
 *   4. Only after successful ImageKit deletion, clear profileImageUrl and profileImageFileId in DB.
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
          `Unsupported file type. Allowed: ${ALLOWED_MIMES.join(", ")}`
        )
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
      return res.status(400).json({
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
      return res.status(400).json({
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
 * Returns true on success, false on failure.
 * Catches all errors internally so it never throws or causes unhandled rejections.
 */
async function safeDeleteImageKitFile(fileId) {
  if (!fileId) return true;
  try {
    const imagekit = require("../config/imagekitClient");
    await imagekit.files.delete(fileId);
    return true;
  } catch (err) {
    console.error(
      `[Profile] ImageKit deletion failed for fileId=${fileId}:`,
      err.message || err
    );
    return false;
  }
}

/**
 * POST /api/profile/photo
 */
exports.uploadPhoto = async (req, res, next) => {
  let newlyUploadedFileId = null;
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "No image file provided." });
    }

    // 1. Read current user's old profileImageFileId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found." });
    }
    const oldFileId = user.profileImageFileId;

    const imagekit = require("../config/imagekitClient");

    const ext =
      req.file.mimetype === "image/png"
        ? "png"
        : req.file.mimetype === "image/webp"
        ? "webp"
        : "jpg";
    const fileName = `profile_${userId}.${ext}`;

    // 2. Upload new cropped image to ImageKit with useUniqueFileName: true
    const uploadResult = await imagekit.files.upload({
      file: req.file.buffer.toString("base64"),
      fileName,
      folder: "/anvor/profiles/",
      useUniqueFileName: true,
    });

    const newUrl = uploadResult.url;
    const newFileId = uploadResult.fileId;
    newlyUploadedFileId = newFileId;

    // 3. Update MongoDB
    user.profileImageUrl = newUrl;
    user.profileImageFileId = newFileId;
    await user.save();
    newlyUploadedFileId = null; // Successfully saved

    // 4. Return successful response immediately (non-blocking)
    res.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.status(200).json({
      success: true,
      data: {
        profileImageUrl: newUrl,
      },
    });

    // 5. Asynchronous cleanup of old ImageKit file after successful response
    if (oldFileId && oldFileId !== newFileId) {
      setImmediate(async () => {
        try {
          await safeDeleteImageKitFile(oldFileId);
        } catch (cleanupErr) {
          console.error(
            `[Profile] Background cleanup failed for oldFileId=${oldFileId}:`,
            cleanupErr.message || cleanupErr
          );
        }
      });
    }
  } catch (err) {
    // 4. Database failure safety: If ImageKit upload succeeded but MongoDB update failed,
    // attempt to clean up the newly created orphan asset
    if (newlyUploadedFileId) {
      try {
        await safeDeleteImageKitFile(newlyUploadedFileId);
      } catch (cleanupErr) {
        console.error(
          `[Profile] Cleanup of orphan fileId=${newlyUploadedFileId} failed:`,
          cleanupErr.message || cleanupErr
        );
      }
    }
    next(err);
  }
};

/**
 * DELETE /api/profile/photo
 */
exports.deletePhoto = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found." });
    }

    if (!user.profileImageUrl && !user.profileImageFileId) {
      res.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate"
      );
      return res
        .status(200)
        .json({ success: true, data: { profileImageUrl: null } });
    }

    const fileId = user.profileImageFileId;

    // Delete exact ImageKit asset if fileId exists
    if (fileId) {
      const imagekit = require("../config/imagekitClient");
      // If ImageKit deletion throws, let it fail and do NOT clear DB
      await imagekit.files.delete(fileId);
    }

    // Only after successful ImageKit deletion, clear DB fields
    user.profileImageUrl = null;
    user.profileImageFileId = null;
    await user.save();

    res.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    return res
      .status(200)
      .json({ success: true, data: { profileImageUrl: null } });
  } catch (err) {
    next(err);
  }
};
