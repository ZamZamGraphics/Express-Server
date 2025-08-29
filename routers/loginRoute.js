const router = require("express").Router();
const {
    login,
    verification,
    resendVerification,
    forgotPassowrd,
    resetPassword,
    verify2FA
} = require("../controllers/loginController");
const {
    doLoginValidators,
    doLoginValidationHandler,
} = require("../validator/loginValidator");
const {
    resetPasswordValidators,
    resetPasswordValidationHandler,
} = require("../validator/resetPasswordValidator");
const { tokenValidators, tokenValidationHandler } = require("../validator/tokenValidator");

// Login, Verify, Resend, Forgot password Route
router.post("/login", doLoginValidators, doLoginValidationHandler, login);
router.get("/verify", verification);
router.post("/verify2fa", tokenValidators, tokenValidationHandler, verify2FA);
router.post("/resend", resendVerification);
router.post("/forgot-password", forgotPassowrd);
router.post("/reset",
    resetPasswordValidators,
    resetPasswordValidationHandler,
    resetPassword
);

module.exports = router;
