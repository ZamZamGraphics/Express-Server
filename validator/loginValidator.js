const { check, validationResult } = require("express-validator");
const { resourceError } = require("../utilities/error");

const doLoginValidators = [
  check("username")
    .isLength({
      min: 1,
    })
    .withMessage("Username or email is required"),
  check("password").isLength({ min: 1 }).withMessage("Password is required"),
];

const doLoginValidationHandler = function (req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  return resourceError(res, errors.mapped());
};

module.exports = {
  doLoginValidators,
  doLoginValidationHandler,
};
