const multer = require("multer");
const path = require("path");
const createError = require("http-errors");
const util = require("util");

const UPLOADS_FOLDER = `${__dirname}/../public/upload/`;
const maxSize = 2 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_FOLDER);
  },
  filename: (req, file, cb) => {
    const fileExt = path.extname(file.originalname);
    const fileName =
      file.originalname
        .replace(fileExt, "")
        .toLowerCase()
        .split(" ")
        .join("-") +
      "-" +
      Date.now();

    cb(null, fileName + fileExt);
  },
});

const whitelist = ["image/png", "image/jpeg", "image/jpg"];

const uploadFile = multer({
  storage: storage,
  limits: { fileSize: maxSize },
  fileFilter: (req, file, cb) => {
    if (whitelist.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(createError("Only .png, .jpg and .jpeg format allowed!"));
    }
  },
}).single("avatar");

// create the exported middleware object
let uploadImage = util.promisify(uploadFile);
module.exports = uploadImage;
