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
const upload = require("../utilities/multer");

// User route
router.get("/", allUser);
router.get("/:id", userById);

router.post(
  "/register",
  upload.single("avatar"),
  avatarUpload,
  userValidators,
  userValidationHandler,
  register
);

router.patch(
  "/:id",
  upload.single("avatar"),
  avatarUpload,
  userUpdateValidators,
  userUpdateValidationHandler,
  updateUser
);
router.delete("/:id", deleteUser);

module.exports = router;
