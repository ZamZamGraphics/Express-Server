const router = require("express").Router();
const authenticate = require("../middleware/authenticate");

const {
    login,
    verification,
    resendVerification,
    forgotPassowrd,
    resetPassword,
} = require("../controllers/authController");
const {
    doLoginValidators,
    doLoginValidationHandler,
} = require("../validator/loginValidator");
const {
    resetPasswordValidators,
    resetPasswordValidationHandler,
} = require("../validator/resetPasswordValidator");
const { tokenValidators, tokenValidationHandler } = require("../validator/tokenValidator");
const {
    setup2FA,
    confirm2FASetup,
    disable2FA,
    complete2FALogin
} = require("../controllers/2faController");
const { getTrustedDevice, deleteTrustedDevice } = require("../controllers/trustedDeviceController");

// Login, Verify, Resend, Forgot password Route
router.post("/login",
    doLoginValidators,
    doLoginValidationHandler,
    login
);
router.post("/2fa/login",
    tokenValidators,
    tokenValidationHandler,
    complete2FALogin
);
router.get("/verify", verification);
router.post("/resend", resendVerification);
router.post("/forgot-password", forgotPassowrd);
router.post("/reset-password",
    resetPasswordValidators,
    resetPasswordValidationHandler,
    resetPassword
);

router.post("/2fa/setup", authenticate, setup2FA);
router.post("/2fa/verify-setup", authenticate, confirm2FASetup);
router.post("/2fa/disable", authenticate, disable2FA);
router.get("/trusted-device", authenticate, getTrustedDevice);
router.delete("/trusted-device/:id", authenticate, deleteTrustedDevice);

module.exports = router;
