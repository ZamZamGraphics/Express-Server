const Expense = require("../models/Expense");
const { serverError } = require("../utilities/error");

const allExpense = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Date filter
        const dateFilter = {};
        if (req.query.from) {
            dateFilter.$gte = new Date(req.query.from);
        }
        if (req.query.to) {
            const endDate = new Date(req.query.to);
            endDate.setHours(23, 59, 59, 999); // include full day
            dateFilter.$lte = endDate;
        }

        let search = req.query.search || null;
        const searchQuery = {
            $or: [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { type: search },
            ],
        };
        search = search ? searchQuery : {};

        const matchStage = { ...search };
        if (Object.keys(dateFilter).length > 0) {
            matchStage.date = dateFilter;
        }

        const total = await Expense.count(matchStage);
        const expenses = await Expense.find(matchStage)
            .populate({
                path: "user",
                select: "fullname",
            })
            .select({
                __v: 0,
            })
            .skip(skip)
            .limit(limit)
            .sort({ date: -1 });
        res.status(200).json({ expenses, total });
    } catch (error) {
        serverError(res, error);
    }
}

const expenseById = async (req, res) => {
    try {
        let id = req.params.id;
        const expense = await Expense.findById(id)
            .populate({
                path: "user",
                select: "fullname",
            }).select({ __v: 0 });
        res.status(200).json(expense);
    } catch (error) {
        serverError(res, error);
    }
};

const newExpense = async (req, res) => {
    try {
        const data = new Expense({ ...req.body, user: req.user.userid });
        const expense = await data.save();
        res.status(201).json({
            success: true,
            message: "New Expense added successfully",
            expense,
        });
    } catch (error) {
        serverError(res, error);
    }
}

const updateExpense = async (req, res) => {
    try {
        let { id } = req.params;
        const updateData = await Expense.findByIdAndUpdate(
            id,
            { $set: req.body },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: "Expense was updated successfully",
            expense: updateData,
        });
    } catch (error) {
        serverError(res, error);
    }
}

const deleteExpense = async (req, res) => {
    try {
        let id = req.params.id;
        await Expense.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "Expense was deleted!" });
    } catch (error) {
        serverError(res, error);
    }
}

module.exports = {
    allExpense,
    expenseById,
    newExpense,
    updateExpense,
    deleteExpense
}