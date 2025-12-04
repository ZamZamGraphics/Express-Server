const router = require("express").Router();

const {
  register,
  allUser,
  userById,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const {
  userValidators,
  userValidationHandler,
} = require("../validator/userValidator");
const {
  userUpdateValidators,
  userUpdateValidationHandler,
} = require("../validator/userUpdateValidator");
const avatarUpload = require("../middleware/avatarUpload");

// User route
router.get("/", allUser);
router.get("/:id", userById);

router.post(
  "/register",
  avatarUpload,
  userValidators,
  userValidationHandler,
  register
);

router.patch(
  "/:id",
  avatarUpload,
  userUpdateValidators,
  userUpdateValidationHandler,
  updateUser
);
router.delete("/:id", deleteUser);

module.exports = router;
