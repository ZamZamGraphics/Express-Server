const Employee = require("../models/Employee");
const { serverError, resourceError } = require("../utilities/error");
const { fileExists, deleteFile } = require("../utilities/r2Service");
const path = require("path");
const { unlink } = require("fs");

const allEmployee = async (req, res) => {
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
                { fullName: { $regex: search, $options: "i" } },
                { fathersName: { $regex: search, $options: "i" } },
                { mothersName: { $regex: search, $options: "i" } },
                { address: { $regex: search, $options: "i" } },
                { gender: search },
                { phone: search },
                { email: search },
                { status: search },
                { designation: { $regex: search, $options: "i" } },
                { nid: search },
                { bloodGroup: { $regex: search, $options: "i" } },
                { education: { $regex: search, $options: "i" } },
            ],
        };
        search = search ? searchQuery : {};

        const matchStage = { ...search };
        if (Object.keys(dateFilter).length > 0) {
            matchStage.registeredAt = dateFilter;
        }

        const total = await Employee.count(matchStage);
        const result = await Employee.find(matchStage)
            .select({
                __v: 0,
            })
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ registeredAt: -1 });
        res.status(200).json({ employee: result, total });
    } catch (error) {
        serverError(res, error);
    }
};

const employeeById = async (req, res) => {
    try {
        let id = req.params.id;
        const employee = await Employee.findById(id)
            .populate({
                path: "user",
                select: "fullname",
            })
            .select({
                __v: 0,
            });
        res.status(200).json(employee);
    } catch (error) {
        serverError(res, error);
    }
};

const register = async (req, res) => {
    try {
        const phonePrimary = req.body?.phonePrimary;
        const phoneSecondary = req.body?.phoneSecondary || "";

        const data = {
            ...req.body,
            phone: [phonePrimary, phoneSecondary],
            user: req.user.userid,
            avatar: null,
        };
        if (req?.file) {
            data.avatar = req.file.key
        }

        const employeeData = new Employee(data);
        const employee = await employeeData.save();

        res.status(201).json({
            message: "New employee register successfully.",
            employee,
        });
    } catch (error) {
        serverError(res, error);
    }
};

const updateEmployee = async (req, res) => {
    try {
        let { id } = req.params;
        const employee = await Employee.findById(id);

        const phonePrimary = req.body?.phonePrimary;
        const phoneSecondary = req.body?.phoneSecondary || "";

        let avatar = employee.avatar;
        if (req?.file) {
            if (avatar) {
                const oldAvatar = await fileExists(avatar)
                if (oldAvatar) {
                    await deleteFile(avatar);
                }
            }
            avatar = req.file.key
        }

        const updatedData = {
            ...req.body,
            avatar,
            phone: [phonePrimary, phoneSecondary],
        };

        const updateData = await Employee.findByIdAndUpdate(
            id,
            { $set: updatedData },
            { new: true }
        );

        res.status(200).json({
            message: "Employee was updated successfully",
            employee: updateData,
        });
    } catch (error) {
        serverError(res, error);
    }
};

const deleteEmployee = async (req, res) => {
    try {
        let id = req.params.id;

        const employee = await Employee.findById(id);

        // remove uploaded files
        if (employee?.avatar) {
            await deleteFile(employee.avatar)
        }

        await Employee.findByIdAndDelete(id);
        res.status(200).json({ message: "Employee was deleted!" });
    } catch (error) {
        serverError(res, error);
    }
};

module.exports = {
    allEmployee,
    employeeById,
    register,
    updateEmployee,
    deleteEmployee,
};
