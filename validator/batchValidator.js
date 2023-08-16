const { check, validationResult } = require("express-validator");
const { resourceError } = require("../utilities/error");
const Batch = require("../models/Batch");
const Course = require("../models/Course");
const Student = require("../models/Student");

// batch validator
const batchValidators = [
  check("batchNo")
    .isLength({ min: 1 })
    .withMessage("Batch Number is required")
    .isNumeric()
    .withMessage("Invalid Batch Number")
    .trim()
    .custom(async (value) => {
      try {
        const batch = await Batch.findOne({ batchNo: value });
        if (batch) {
          throw new Error("Batch No already is use!");
        }
      } catch (error) {
        throw new Error(error.message);
      }
    }),
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

const batchValidationHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  return resourceError(res, errors.array());
};

module.exports = {
  batchValidators,
  batchValidationHandler,
};
