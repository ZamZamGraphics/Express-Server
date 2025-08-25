const { check, validationResult } = require("express-validator");
const { resourceError } = require("../utilities/error");
const path = require("path");
const { unlink } = require("fs");

// employee validator
const employeeValidators = [
    check("fullName")
        .isLength({ min: 3 })
        .withMessage("FullName is required")
        .trim(),
    check("fathersName")
        .isLength({ min: 3 })
        .withMessage("Fathers Name is required")
        .trim(),
    check("mothersName")
        .isLength({ min: 3 })
        .withMessage("Mothers Name is required")
        .trim(),
    check("address")
        .isLength({ min: 1 })
        .withMessage("Address is required")
        .trim(),
    check("birthDay")
        .isLength({ min: 1 })
        .withMessage("Birth Date is required")
        .isISO8601()
        .toDate()
        .withMessage("Enter date of birth in DD-MM-YYYY format"),
    check("gender")
        .isLength({ min: 1 })
        .withMessage("Gender is required")
        .isIn(["Male", "Female"])
        .withMessage("Gender must be Male or Female"),
    check("selfNumber")
        .isLength({ min: 1 })
        .withMessage("Mobile number required")
        .isInt()
        .isMobilePhone("bn-BD")
        .withMessage("Mobile number invalid"),
    check("homeNumber")
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
];

const employeeValidationHandler = (req, res, next) => {
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
    employeeValidators,
    employeeValidationHandler,
};
