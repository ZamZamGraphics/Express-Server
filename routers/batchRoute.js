const router = require("express").Router();

router.get("/", (req, res) => {
  res.status(200).json({ message: "All Batch" });
});
router.get("/:id", (req, res) => {
  res.status(200).json({ message: "Single Batch by ID" });
});

router.post("/new", (req, res) => {
  res.status(200).json({ message: "New Batch" });
});
router.patch("/:id", (req, res) => {
  res.status(200).json({ message: "Batch Update" });
});
router.delete("/:id", (req, res) => {
  res.status(200).json({ message: "Batch Delete" });
});

module.exports = router;
