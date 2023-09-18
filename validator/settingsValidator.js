const { check, validationResult } = require("express-validator");
const { resourceError } = require("../utilities/error");

// settings validator
const settingsValidators = [
  check("siteTitle")
    .isLength({ min: 3 })
    .withMessage("Site Title is required")
    .trim(),
  check("tagline")
    .isLength({ min: 3 })
    .withMessage("Tagline is required")
    .trim(),
  check("email")
    .isLength({ min: 1 })
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .trim(),
  check("perPage")
    .isLength({ min: 1 })
    .withMessage("Show Per Page is required")
    .isNumeric()
    .withMessage("Invalid Per Page number"),
];

const settingsValidationHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  return resourceError(res, errors.mapped());
};

module.exports = {
  settingsValidators,
  settingsValidationHandler,
};
