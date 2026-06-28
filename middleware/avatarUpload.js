const { uploadFile } = require("../utilities/r2Service")

const avatarUpload = async (req, res, next) => {
  try {
    if (req?.file) {
      // Optional: use a custom prefix from the request body e.g. "avatars"
      const prefix = req.body.folder || "uploads";
      const result = await uploadFile(req.file, prefix);

      req.file = result;
    }
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = avatarUpload;
