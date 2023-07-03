const router = require("express").Router();
const {
  login,
  verification,
  resendVerification,
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

// public route
router.get("/verify", verification);
router.post("/resend", resendVerification);

router.post("/login", doLoginValidators, doLoginValidationHandler, login);

//privet route
router.get("/", allUser);
router.get("/:id", userById);

router.post("/register", userValidators, userValidationHandler, register);
router.patch(
  "/:id",
  userUpdateValidators,
  userUpdateValidationHandler,
  updateUser
);
router.delete("/:id", deleteUser);

module.exports = router;
