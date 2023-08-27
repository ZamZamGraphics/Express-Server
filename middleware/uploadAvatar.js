const uploadImage = require("../utilities/uploadImage");
const { resourceError } = require("../utilities/error");

const uploadAvatar = async (req, res, next) => {
  try {
    await uploadImage(req, res);
    next();
  } catch (error) {
    // error handling
    if (error.code == "LIMIT_FILE_SIZE") {
      return resourceError(res, {
        message: "File larger than 2MB cannot be uploaded!",
      });
    }
    return resourceError(res, error);
  }
};

module.exports = uploadAvatar;
