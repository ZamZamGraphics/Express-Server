const uploader = require("../utilities/singleUploader");
const { resourceError } = require("../utilities/error");

function avatarUpload(req, res, next) {
  const upload = uploader(
    "upload",
    ["image/jpeg", "image/jpg", "image/png"],
    1000000,
    "Only .jpg, jpeg or .png format allowed!"
  );

  // call the middleware function
  upload.any()(req, res, (err) => {
    if (err) {
      if (err.code == "LIMIT_FILE_SIZE") {
        return resourceError(res, {
          message: "File larger than 2MB cannot be uploaded!",
        });
      }
      return resourceError(res, err);
    } else {
      next();
    }
  });
}

module.exports = avatarUpload;
