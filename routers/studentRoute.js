const router = require("express").Router();
const {
  allStudents,
  studentById,
  register,
  updateStudent,
  deleteStudent,
} = require("../controllers/studentController");
const authenticate = require("../middleware/authenticate");
const {
  studentValidators,
  studentValidationHandler,
} = require("../validator/studentValidatior");

router.get("/", allStudents);
router.get("/:id", studentById);

router.post("/register", authenticate, studentValidators, studentValidationHandler, register);
router.patch("/:id", updateStudent);
router.delete("/:id", deleteStudent);

module.exports = router;
