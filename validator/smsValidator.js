const { check, validationResult } = require("express-validator");
const { resourceError } = require("../utilities/error");

// sms validator
const smsValidators = [
  check("number")
    .isLength({ min: 1 })
    .withMessage("This field is required.")
    .trim(),
  check("status")
    .isIn(["student", "employee", "batch"])
    .withMessage("Invalid Status field."),
  check("message")
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 350 })
    .withMessage('Message must be 350 characters.')
    .trim()
];

const smsValidationHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  return resourceError(res, errors.mapped());
};

module.exports = {
  smsValidators,
  smsValidationHandler,
};
