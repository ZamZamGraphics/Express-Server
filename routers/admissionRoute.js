const {
  allAdmission,
  admissionById,
  newAdmission,
  deleteAdmission,
  payment,
} = require("../controllers/admissionController");
const {
  admissionValidators,
  admissionValidationHandler,
} = require("../validator/admissionValidator");

const router = require("express").Router();

router.get("/", allAdmission);
router.get("/:id", admissionById);

router.post(
  "/new",
  admissionValidators,
  admissionValidationHandler,
  newAdmission
);
router.post(
  "/payment",
  admissionValidators,
  admissionValidationHandler,
  payment
);

router.delete("/:id", deleteAdmission);

module.exports = router;
