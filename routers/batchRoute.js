const router = require("express").Router();

const {
  allBatches,
  batchById,
  newBatch,
  updateBatch,
  deleteBatch,
} = require("../controllers/batchController");
const {
  batchValidators,
  batchValidationHandler,
} = require("../validator/batchValidator");
const {
  batchUpdateValidators,
  batchUpdateValidationHandler,
} = require("../validator/batchUpdateValidator");

router.get("/", allBatches);
router.get("/:id", batchById);

router.post("/new", batchValidators, batchValidationHandler, newBatch);
router.patch(
  "/:id",
  batchUpdateValidators,
  batchUpdateValidationHandler,
  updateBatch
);
router.delete("/:id", deleteBatch);

module.exports = router;
