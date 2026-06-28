// external imports
const multer = require("multer");
const path = require("path");
const createError = require("http-errors");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ALLOWED_MIME_TYPES = [
    // Images
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/svg+xml",
  ];

  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(createError(`File type not allowed: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB per file
  },
});

module.exports = upload;

