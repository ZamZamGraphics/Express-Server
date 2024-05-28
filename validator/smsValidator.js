const { check, validationResult } = require("express-validator");
const { resourceError } = require("../utilities/error");

// sms validator
const smsValidators = [
  check("studentId")
    .optional({ checkFalsy: true })
    .isArray(),
  check("batchNo")
    .optional({ checkFalsy: true })
    .isNumeric()
    .withMessage("Invalid Batch Number")
    .trim(),
  check("messages")
    .notEmpty()
    .withMessage('Messages is required')
    .isLength({max:350})       
    .withMessage('Messages must be 350 characters')
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
