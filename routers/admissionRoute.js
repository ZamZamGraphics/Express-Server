const {
  allAdmission,
  admissionById,
  findByStdId,
  newAdmission,
  deleteAdmission,
  payment,
  migratePaymentsBulk,
} = require("../controllers/admissionController");
const {
  admissionValidators,
  admissionValidationHandler,
} = require("../validator/admissionValidator");
const {
  paymentValidators,
  paymentValidationHandler
} = require("../validator/paymentValidator");

const router = require("express").Router();

router.get("/migrate", migratePaymentsBulk);
router.get("/", allAdmission);
router.get("/:id", admissionById);
router.get("/:batchNo/:studentId", findByStdId);

router.post(
  "/new",
  admissionValidators,
  admissionValidationHandler,
  newAdmission
);

router.post(
  "/payment",
  paymentValidators,
  paymentValidationHandler,
  payment
);

router.delete("/:id", deleteAdmission);

module.exports = router;
