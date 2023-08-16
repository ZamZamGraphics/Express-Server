const { check, validationResult } = require("express-validator");
const { resourceError } = require("../utilities/error");
const Student = require("../models/Student");

// batch validator
const batchUpdateValidators = [
  check("student")
    .isLength({ min: 1 })
    .withMessage("Student Id is required")
    .trim(),
  check("startDate")
    .isLength({ min: 1 })
    .withMessage("Start Date is required")
    .isISO8601()
    .toDate()
    .withMessage("Select date in YYYY-MM-DD format")
    .trim(),
  check("classDays")
    .isLength({ min: 1 })
    .withMessage("Class Days is required")
    .trim(),
  check("classTime")
    .isLength({ min: 1 })
    .withMessage("Class Time is required")
    .trim(),
];

const batchUpdateValidationHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  return resourceError(res, errors.array());
};

module.exports = {
  batchUpdateValidators,
  batchUpdateValidationHandler,
};
