const { check, validationResult } = require("express-validator");
const { resourceError } = require("../utilities/error");
const User = require("../models/User");

// user validator
const userValidators = [
  check("username")
    .isLength({ min: 1 })
    .withMessage("Username is required")
    .isAlpha("en-US", { ignore: " -" })
    .withMessage("Name must not contain anything other than alphabet")
    .trim()
    .custom(async (value) => {
      try {
        const user = await User.findOne({ username: value });
        if (user) {
          throw new Error("Username already is use!");
        }
      } catch (error) {
        throw new Error(error.message);
      }
    }),
  check("email")
    .isLength({ min: 1 })
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .trim()
    .custom(async (value) => {
      try {
        const user = await User.findOne({ email: value });
        if (user) {
          throw new Error("Email already is use!");
        }
      } catch (error) {
        throw new Error(error.message);
      }
    }),
  check("password")
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

const userValidationHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  return resourceError(res, errors.array());
};

module.exports = {
  userValidators,
  userValidationHandler,
};
