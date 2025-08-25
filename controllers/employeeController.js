const Employee = require("../models/Employee");
const { serverError, resourceError } = require("../utilities/error");
const path = require("path");
const { unlink } = require("fs");

const allEmployee = async (req, res) => {
    try {
        const limit = req.query.limit || 0;
        const page = req.query.page || 0;
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
                { designation: { $regex: search, $options: "i" } },
                { nid: search },
                { bloodGroup: { $regex: search, $options: "i" } },
                { education: { $regex: search, $options: "i" } },
            ],
        };
        search = search ? searchQuery : {};
        const total = await Employee.count(search);
        const employeeList = await Employee.find(search)
            .select({
                __v: 0,
            })
            // users?page=1&limit=10&search=value
            .skip(limit * page) // Page Number * Show Par Page
            .limit(parseInt(limit)) // Show Par Page
            .sort({ registeredAt: -1 }); // Last  is First
        res.status(200).json({ employeeList, total });
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
        const selfNumber = req.body?.selfNumber;
        const homeNumber = req.body?.homeNumber || "";

        let newEmployee;
        if (req.files && req.files.length > 0) {
            newEmployee = new Employee({
                ...req.body,
                phone: [selfNumber, homeNumber],
                user: req.user.userid,
                avatar: req.files[0].filename,
            });
        } else {
            newEmployee = new Employee({
                ...req.body,
                phone: [selfNumber, homeNumber],
                user: req.user.userid,
                avatar: null,
            });
        }

        const employee = await newEmployee.save();
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

        const selfNumber = req.body.selfNumber;
        const homeNumber = req.body.homeNumber || "";

        let avatar = employee.avatar;
        if (req.files && req.files.length > 0) {
            if (avatar !== null && avatar !== req.files[0].filename) {
                // check new avatar and remove old avatar
                unlink(
                    path.join(__dirname, `/../public/upload/${employee.avatar}`),
                    (err) => {
                        if (err) resourceError(res, err);
                    }
                );
            }
            avatar = req.files[0].filename;
        }

        const updatedData = {
            ...req.body,
            avatar,
            phone: [selfNumber, homeNumber],
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
            unlink(
                path.join(__dirname, `/../public/upload/${employee.avatar}`),
                (err) => {
                    if (err) resourceError(res, err);
                }
            );
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
