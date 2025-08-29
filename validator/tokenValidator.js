const { check, validationResult } = require("express-validator");
const { resourceError } = require("../utilities/error");

// token validator
const tokenValidators = [
    check("token")
        .isLength({ min: 1 })
        .withMessage("Token is required")
        .trim()
];

const tokenValidationHandler = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    return resourceError(res, errors.mapped());
};

module.exports = {
    tokenValidators,
    tokenValidationHandler,
};
