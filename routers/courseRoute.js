const router = require("express").Router();

router.get("/", (req, res) => {
  res.status(200).json({ message: "All Course" });
});
router.get("/:id", (req, res) => {
  res.status(200).json({ message: "Single Course by ID" });
});

router.post("/new", (req, res) => {
  res.status(200).json({ message: "New Course" });
});
router.patch("/:id", (req, res) => {
  res.status(200).json({ message: "Course Update" });
});
router.delete("/:id", (req, res) => {
  res.status(200).json({ message: "Course Delete" });
});

module.exports = router;
