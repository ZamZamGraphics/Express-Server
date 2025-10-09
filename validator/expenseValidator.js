const { check, validationResult } = require("express-validator");
const { resourceError } = require("../utilities/error");

const expenseValidator = [
    check("name")
        .isLength({ min: 3 })
        .withMessage("Name is required")
        .trim(),
    check("description")
        .isLength({ min: 1 })
        .withMessage("Duration is required")
        .trim(),
    check("type")
        .isLength({ min: 1 })
        .withMessage("Expense Type is required")
        .trim(),
    check("amount")
        .isLength({ min: 1 })
        .withMessage("Amount is required")
        .isNumeric()
        .withMessage("Invalid amount number"),
];

const expenseValidationHandler = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    return resourceError(res, errors.mapped());
};

module.exports = {
    expenseValidator,
    expenseValidationHandler,
};
