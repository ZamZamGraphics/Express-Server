const { check, validationResult } = require("express-validator");
const { resourceError } = require("../utilities/error");
const User = require("../models/User");
const path = require("path");
const { unlink } = require("fs");

// user validator
const userUpdateValidators = [
  check("email")
    .isLength({ min: 1 })
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .trim()
    .custom(async (value, { req }) => {
      try {
        const user = await User.findById(req.params.id);
        if (user) {
          if (user.email !== req.body.email) {
            const user = await User.findOne({ email: value });
            if (user) {
              throw new Error(`Email already is use!`);
            }
          }
        }
      } catch (error) {
        throw new Error(error.message);
      }
    }),
  check("password")
    .optional()
    .isStrongPassword()
    .withMessage(
      "Password must be at least 8 characters long & should contain at least 1 lowercase, 1 uppercase, 1 number & 1 symbol"
    ),
  check("status")
    .isIn(["Verified", "Unverified"])
    .withMessage("Status must be Verified or Unverified"),
  check("role")
    .isIn(["Admin", "User"])
    .withMessage("Role must be Admin ro User"),
];

const userUpdateValidationHandler = (req, res, next) => {
  const errors = validationResult(req);
  const mappedErrors = errors.mapped();
  if (Object.keys(mappedErrors).length === 0) {
    next();
  } else {
    // remove uploaded files
    if (req.files.length > 0) {
      const { filename } = req.files[0];
      unlink(path.join(__dirname, `/../public/upload/${filename}`), (err) => {
        if (err) resourceError(res, err);
      });
    }
    return resourceError(res, mappedErrors);
  }
};

module.exports = {
  userUpdateValidators,
  userUpdateValidationHandler,
};
