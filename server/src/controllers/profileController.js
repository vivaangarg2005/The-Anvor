

























const multer = require("multer");
const User = require("../models/User");


const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; 

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






exports.uploadMiddleware = (req, res, next) => {
  upload.single("photo")(req, res, (err) => {
    if (!err) return next();

    
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "File too large. Maximum size is 5 MB.",
      });
    }
    
    if (err.message && err.message.includes("Unsupported file type")) {
      return res.status(400).json({ success: false, error: err.message });
    }
    
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        error: 'Unexpected file field. Use field name "photo".',
      });
    }
    
    next(err);
  });
};






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




exports.uploadPhoto = async (req, res, next) => {
  let newlyUploadedFileId = null;
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "No image file provided." });
    }

    
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

    
    const uploadResult = await imagekit.files.upload({
      file: req.file.buffer.toString("base64"),
      fileName,
      folder: "/anvor/profiles/",
      useUniqueFileName: true,
    });

    const newUrl = uploadResult.url;
    const newFileId = uploadResult.fileId;
    newlyUploadedFileId = newFileId;

    
    user.profileImageUrl = newUrl;
    user.profileImageFileId = newFileId;
    await user.save();
    newlyUploadedFileId = null; 

    
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

    
    if (fileId) {
      const imagekit = require("../config/imagekitClient");
      
      await imagekit.files.delete(fileId);
    }

    
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
