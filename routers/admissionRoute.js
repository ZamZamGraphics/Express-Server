const router = require("express").Router();

router.get("/", (req, res) => {
  res.status(200).json({ message: "All Admission" });
});
router.get("/:id", (req, res) => {
  res.status(200).json({ message: "Single Admission by ID" });
});

router.post("/new", (req, res) => {
  res.status(200).json({ message: "New Admission" });
});
router.patch("/:id", (req, res) => {
  res.status(200).json({ message: "Admission Update" });
});
router.delete("/:id", (req, res) => {
  res.status(200).json({ message: "Admission Delete" });
});

module.exports = router;
