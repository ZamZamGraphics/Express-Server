const router = require("express").Router();

const {
    allExpense,
    expenseById,
    newExpense,
    updateExpense,
    deleteExpense
} = require("../controllers/expenseController");
const {
    expenseValidator,
    expenseValidationHandler
} = require("../validator/expenseValidator");

router.get("/", allExpense);
router.get("/:id", expenseById);

router.post("/new", expenseValidator, expenseValidationHandler, newExpense);
router.patch("/:id", expenseValidator, expenseValidationHandler, updateExpense);
router.delete("/:id", deleteExpense);

module.exports = router;