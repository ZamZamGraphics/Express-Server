const router = require("express").Router();
const { findStudent } = require("../controllers/apiController");

router.get("/student", findStudent);

module.exports = router;
