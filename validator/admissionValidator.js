const { check, validationResult } = require("express-validator");
const { resourceError } = require("../utilities/error");
const Course = require("../models/Course");

// batch validator
const admissionValidators = [
  check("student")
    .isLength({ min: 1 })
    .withMessage("Student Id is required")
    .trim(),
  check("course")
    .isLength({ min: 1 })
    .withMessage("Course Name is required")
    .trim()
    .custom(async (value) => {
      try {
        const course = await Course.findById({ _id: value });
        if (!course) {
          throw new Error("Course not exist!");
        }
      } catch (error) {
        throw new Error(error.message);
      }
    }),
  check("batch")
    .isLength({ min: 1 })
    .withMessage("Batch Number is required")
    .isNumeric()
    .withMessage("Invalid Batch Number")
    .trim(),
  check("discount")
    .optional({ checkFalsy: true })
    .isNumeric()
    .withMessage("Invalid Amount")
    .trim(),
  check("payment")
    .isLength({ min: 1 })
    .withMessage("Payment is required")
    .isNumeric()
    .withMessage("Invalid Amount")
    .trim(),
  check("nextPay")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate()
    .withMessage("Select date in YYYY-MM-DD format")
    .trim(),
  check("paymentType")
    .isLength({ min: 1 })
    .withMessage("Payment Type is required")
    .isIn(["New", "Payment"])
    .withMessage("Payment Type must be New or Payment"),
];

const admissionValidationHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  return resourceError(res, errors.array());
};

module.exports = {
  admissionValidators,
  admissionValidationHandler,
};
