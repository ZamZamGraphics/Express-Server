const router = require("express").Router();
const { login } = require("../controllers/loginController");
const {
  register,
  allUser,
  singleUser,
} = require("../controllers/userController");
const {
  doLoginValidators,
  doLoginValidationHandler,
} = require("../validator/loginValidator");
const {
  userValidators,
  userValidationHandler,
} = require("../validator/userValidator");

router.get("/", allUser);
router.get("/:id", singleUser);

router.post("/register", userValidators, userValidationHandler, register);
router.put("/:id");
router.delete("/:id");
router.post("/login", doLoginValidators, doLoginValidationHandler, login);

module.exports = router;
