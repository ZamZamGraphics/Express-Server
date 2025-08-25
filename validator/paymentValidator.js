const { check, validationResult } = require("express-validator");
const { resourceError } = require("../utilities/error");

// Payment validator
const paymentValidators = [
    check("student")
        .isLength({ min: 1 })
        .withMessage("Student Id is required")
        .isNumeric()
        .withMessage("Invalid Student Id")
        .trim(),
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
        .withMessage("Select date in DD-MM-YYYY format"),
];

const paymentValidationHandler = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    return resourceError(res, errors.mapped());
};

module.exports = {
    paymentValidators,
    paymentValidationHandler,
};
