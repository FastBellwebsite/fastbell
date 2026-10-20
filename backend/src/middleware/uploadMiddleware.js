const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Dedicated uploads directory outside src and build output
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Storage configuration with random UUID filenames and sanitized extensions
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Generate unpredictable UUID filename, never use user-supplied filename
    const uniqueId = crypto.randomUUID();
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.bin';
    cb(null, `${uniqueId}${safeExt}`);
  },
});

// File filter for declared MIME types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

  if (!allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
    const error = new Error('Unsupported image format. Allowed formats: JPEG, PNG, WebP.');
    error.statusCode = 400;
    return cb(error, false);
  }

  cb(null, true);
};

// 5 MB maximum file size
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1,
  },
  fileFilter,
});

/**
 * Validates actual binary file content using magic bytes (file signature).
 * Rejects and deletes the file if it does not match JPEG, PNG, or WebP signatures.
 */
const validateImageContent = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded. Please attach an image file.',
    });
  }

  const filePath = req.file.path;

  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(16);
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);

    let isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    let isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a;
    let isWebp =
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 && // 'RIFF'
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50; // 'WEBP'

    if (!isJpeg && !isPng && !isWebp) {
      // Remove invalid uploaded file immediately
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid file content: The file is not a valid JPEG, PNG, or WebP image.',
      });
    }

    // Standardize file extension based on verified content
    let verifiedExt = isJpeg ? '.jpg' : isPng ? '.png' : '.webp';
    let currentExt = path.extname(filePath).toLowerCase();

    if (currentExt !== verifiedExt && !(isJpeg && currentExt === '.jpeg')) {
      const parsedPath = path.parse(filePath);
      const newFileName = `${parsedPath.name}${verifiedExt}`;
      const newFilePath = path.join(parsedPath.dir, newFileName);
      fs.renameSync(filePath, newFilePath);
      req.file.path = newFilePath;
      req.file.filename = newFileName;
    }

    req.file.verifiedMimeType = isJpeg ? 'image/jpeg' : isPng ? 'image/png' : 'image/webp';
    next();
  } catch (err) {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {}
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to inspect uploaded file content.',
    });
  }
};

/**
 * Express error handler wrapper for multer limit/type errors
 */
const handleUploadErrors = (uploadMiddleware) => (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum allowed file size is 5 MB.',
        });
      }
      if (err.statusCode === 400 || err.message?.includes('Unsupported image format')) {
        return res.status(400).json({
          success: false,
          message: err.message || 'Unsupported file type.',
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error.',
      });
    }
    next();
  });
};

module.exports = {
  upload,
  validateImageContent,
  handleUploadErrors,
  UPLOADS_DIR,
};
