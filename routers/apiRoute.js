const router = require("express").Router();
const { findStudent, getAllMentors } = require("../controllers/apiController");

router.get("/student", findStudent);
router.get("/mentors", getAllMentors);

module.exports = router;
