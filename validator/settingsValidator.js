const { check, validationResult } = require("express-validator");
const { resourceError } = require("../utilities/error");

// settings validator
const settingsValidators = [
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
