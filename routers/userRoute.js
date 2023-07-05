const router = require("express").Router();
const {
  login,
  verification,
  resendVerification,
  forgotPassowrd,
  resetPassword,
} = require("../controllers/loginController");
const {
  register,
  allUser,
  userById,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const {
  doLoginValidators,
  doLoginValidationHandler,
} = require("../validator/loginValidator");
const {
  userValidators,
  userValidationHandler,
} = require("../validator/userValidator");
const {
  userUpdateValidators,
  userUpdateValidationHandler,
} = require("../validator/userUpdateValidator");
const {
  resetPasswordValidators,
  resetPasswordValidationHandler,
} = require("../validator/resetPasswordValidator");
const authenticate = require("../middleware/authenticate");

// public route
router.get("/verify", verification);
router.post("/resend", resendVerification);

// forgot password
router.post("/forgot-password", forgotPassowrd);
router.post(
  "/reset",
  resetPasswordValidators,
  resetPasswordValidationHandler,
  resetPassword
);

// login
router.post("/login", doLoginValidators, doLoginValidationHandler, login);

//privet route
router.get("/", authenticate, allUser);
router.get("/:id", authenticate, userById);

router.post(
  "/register",
  authenticate,
  userValidators,
  userValidationHandler,
  register
);
router.patch(
  "/:id",
  authenticate,
  userUpdateValidators,
  userUpdateValidationHandler,
  updateUser
);
router.delete("/:id", authenticate, deleteUser);

module.exports = router;
