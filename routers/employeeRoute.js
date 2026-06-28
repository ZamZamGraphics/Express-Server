const router = require("express").Router();
const {
    allEmployee,
    employeeById,
    register,
    updateEmployee,
    deleteEmployee
} = require("../controllers/employeeController");
const avatarUpload = require("../middleware/avatarUpload");
const upload = require("../utilities/multer");
const {
    employeeValidators,
    employeeValidationHandler
} = require("../validator/employeeValidator");

router.get("/", allEmployee);
router.get("/:id", employeeById);

router.post(
    "/register",
    upload.single("avatar"),
    avatarUpload,
    employeeValidators,
    employeeValidationHandler,
    register
);

router.patch(
    "/:id",
    upload.single("avatar"),
    avatarUpload,
    employeeValidators,
    employeeValidationHandler,
    updateEmployee
);

router.delete("/:id", deleteEmployee);

module.exports = router;
