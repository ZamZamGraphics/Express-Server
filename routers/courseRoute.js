const router = require("express").Router();

const {
  allCourses,
  courseById,
  newCourse,
  updateCourse,
  deleteCourse,
} = require("../controllers/courseController");
const {
  courseValidators,
  courseValidationHandler,
} = require("../validator/courseValidator");

router.get("/", allCourses);
router.get("/:id", courseById);

router.post("/new", courseValidators, courseValidationHandler, newCourse);
router.patch("/:id", courseValidators, courseValidationHandler, updateCourse);
router.delete("/:id", deleteCourse);

module.exports = router;
