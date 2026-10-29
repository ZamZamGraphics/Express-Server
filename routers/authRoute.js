const router = require("express").Router();
const { authLimiter } = require("../middleware/rateLimit");
const requireAuth = require("../middleware/requireAuth");

const {
    login,
    logout,
    logoutAll,
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
    authLimiter,
    doLoginValidators,
    doLoginValidationHandler,
    login
);
router.post("/2fa/login",
    authLimiter,
    tokenValidators,
    tokenValidationHandler,
    complete2FALogin
);

router.get("/ping", requireAuth, (req, res) => res.json({ ok: true }));
router.post("/logout", requireAuth, logout);
router.post("/logout-all", requireAuth, logoutAll);

router.get("/verify", verification);
router.post("/resend", resendVerification);
router.post("/forgot-password", forgotPassowrd);
router.post("/reset-password",
    resetPasswordValidators,
    resetPasswordValidationHandler,
    resetPassword
);

router.post("/2fa/setup", requireAuth, setup2FA);
router.post("/2fa/verify-setup", requireAuth, confirm2FASetup);
router.post("/2fa/disable", requireAuth, disable2FA);
router.get("/trusted-device", requireAuth, getTrustedDevice);
router.delete("/trusted-device/:id", requireAuth, deleteTrustedDevice);

module.exports = router;
