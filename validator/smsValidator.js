const { check, validationResult } = require("express-validator");
const { resourceError } = require("../utilities/error");

// sms validator
const smsValidators = [
  check("numbers")
    .isArray({ min: 0 })
    .withMessage("Phone Number is required"),
  check("messages")
    .notEmpty()
    .withMessage('Messages is required')
    .isLength({max:280})       
    .withMessage('Messages must be 280 characters')
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
