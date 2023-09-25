const { check, validationResult } = require("express-validator");
const { resourceError } = require("../utilities/error");
const path = require("path");
const { unlink } = require("fs");

// student validator
const studentValidators = [
  check("fullName")
    .isLength({ min: 3 })
    .withMessage("Student Name is required")
    .trim(),
  check("fathersName")
    .isLength({ min: 3 })
    .withMessage("Fathers Name is required")
    .trim(),
  check("mothersName")
    .isLength({ min: 3 })
    .withMessage("Mothers Name is required")
    .trim(),
  check("address.present")
    .isLength({ min: 1 })
    .withMessage("Address is required")
    .trim(),
  check("birthDay")
    .isLength({ min: 1 })
    .withMessage("Birth Date is required")
    .isISO8601()
    .toDate()
    .withMessage("Enter date of birth in YYYY-MM-DD format")
    .trim(),
  check("gender")
    .isLength({ min: 1 })
    .withMessage("Gender is required")
    .isIn(["Male", "Female"])
    .withMessage("Gender must be Male or Female"),
  check("stdPhone")
    .isLength({ min: 1 })
    .withMessage("Mobile number required")
    .isInt()
    .isMobilePhone("bn-BD")
    .withMessage("Mobile number invalid"),
  check("guardianPhone")
    .isInt()
    .optional({ checkFalsy: true })
    .isMobilePhone("bn-BD")
    .withMessage("Mobile number invalid"),
  check("email")
    .isEmail()
    .optional({ checkFalsy: true })
    .withMessage("Invalid email address")
    .trim(),
  check("nid")
    .optional({ checkFalsy: true })
    .isNumeric()
    .withMessage("Invalid NID Number")
    .isLength({
      min: 10,
      max: 17,
    })
    .withMessage("NID Number must be 10 or 17 digits"),
  check("birthCertificate")
    .optional({ checkFalsy: true })
    .isNumeric()
    .withMessage("Invalid Birth Certificate Number")
    .isLength({
      min: 17,
      max: 17,
    })
    .withMessage("Birth Certificate No must be 17 digits"),
  check("status")
    .isIn(["Approved", "Pending", "Rejected"])
    .withMessage("Invalid Status field"),
];

const studentValidationHandler = (req, res, next) => {
  const errors = validationResult(req);
  const mappedErrors = errors.mapped();
  if (Object.keys(mappedErrors).length === 0) {
    next();
  } else {
    // remove uploaded files
    if (req.files.length > 0) {
      const { filename } = req.files[0];
      unlink(path.join(__dirname, `/../public/upload/${filename}`), (err) => {
        if (err) resourceError(res, err);
      });
    }
    return resourceError(res, mappedErrors);
  }
};

module.exports = {
  studentValidators,
  studentValidationHandler,
};
