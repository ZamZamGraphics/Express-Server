const router = require("express").Router();
const {
  allStudents,
  studentById,
  studentByStudentId,
  register,
  updateStudent,
  deleteStudent,
} = require("../controllers/studentController");
const avatarUpload = require("../middleware/avatarUpload");
const {
  studentValidators,
  studentValidationHandler,
} = require("../validator/studentValidatior");

router.get("/", allStudents);
router.get("/:id", studentById);
router.get("/verify/:studentId", studentByStudentId);

router.post(
  "/register",
  avatarUpload,
  studentValidators,
  studentValidationHandler,
  register
);

router.patch(
  "/:id",
  avatarUpload,
  studentValidators,
  studentValidationHandler,
  updateStudent
);

router.delete("/:id", deleteStudent);

module.exports = router;
