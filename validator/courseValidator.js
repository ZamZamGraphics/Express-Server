const { check, validationResult } = require("express-validator");
const { resourceError } = require("../utilities/error");

// course validator
const courseValidators = [
  check("name")
    .isLength({ min: 3 })
    .withMessage("Course Name is required")
    .trim(),
  check("slug")
    .isLength({ min: 3 })
    .withMessage("Fathers Name is required")
    .trim(),
  check("courseType")
    .isLength({ min: 1 })
    .withMessage("Course Type is required")
    .isIn(["Regular", "Private", "Diploma in Computer"])
    .withMessage("Gender must be Regular, Private or Diploma in Computer"),
  check("duration")
    .isLength({ min: 1 })
    .withMessage("Course duration is required")
    .trim(),
  check("courseFee")
    .isLength({ min: 1 })
    .withMessage("Course Fee is required")
    .isNumeric()
    .withMessage("Invalid course Fee"),
];

const courseValidationHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  return resourceError(res, errors.array());
};

module.exports = {
  courseValidators,
  courseValidationHandler,
};
