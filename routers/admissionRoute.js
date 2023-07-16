const {
  allAdmission,
  admissionById,
  newAdmission,
  deleteAdmission,
} = require("../controllers/admissionController");

const router = require("express").Router();

router.get("/", allAdmission);
router.get("/:id", admissionById);

router.post("/new", newAdmission);
router.post("/payment", (req, res) => {
  res.status(200).json({ message: "Payment POST Route" });
});

router.delete("/:id", deleteAdmission);

module.exports = router;
