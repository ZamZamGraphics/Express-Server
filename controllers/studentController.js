const Student = require("../models/Student");
const Admission = require("../models/Admission");
const Batch = require("../models/Batch");
const { serverError, resourceError } = require("../utilities/error");
const validMobileNumber = require("../utilities/validMobileNumber");
const path = require("path");
const { unlink } = require("fs");

const allStudents = async (req, res) => {
  try {
    const limit = req.query.limit || 0;
    const page = req.query.page || 0;
    let search = req.query.search || null;

    const searchQuery = {
      $or: [
        { studentId: search },
        { fullName: { $regex: search, $options: "i" } },
        { fathersName: { $regex: search, $options: "i" } },
        { mothersName: { $regex: search, $options: "i" } },
        { "address.present": { $regex: search, $options: "i" } },
        { "address.permanent": { $regex: search, $options: "i" } },
        { gender: search },
        { phone: search },
        { email: search },
        { occupation: { $regex: search, $options: "i" } },
        { nid: search },
        { birthCertificate: search },
        { bloodGroup: { $regex: search, $options: "i" } },
        { education: { $regex: search, $options: "i" } },
        { reference: { $regex: search, $options: "i" } },
        { status: search },
        { "admission.batch": { $lt: { _id: search } } },
      ],
    };
    search = search ? searchQuery : {};
    const total = await Student.count(search);
    const students = await Student.find(search)
      .populate({ path: "user", select: "fullname" })
      .populate({
        path: "admission",
        model: "Admission",
        select: "batch, course",
        populate: [
          {
            path: "batch",
            model: "Batch",
            select: "batchNo",
          },
          {
            path: "course",
            model: "Course",
            select: "name",
          },
        ],
      })
      .select({
        __v: 0,
      })
      // students?page=1&limit=10&search=value
      .skip(limit * page) // Page Number * Show Par Page
      .limit(limit) // Show Par Page
      .sort({ registeredAt: -1 }); // Last User is First
    res.status(200).json({ students, total });
  } catch (error) {
    serverError(res, error);
  }
};

const studentById = async (req, res) => {
  try {
    let id = req.params.id;
    const student = await Student.findById(id)
      .populate({ path: "user", select: "fullname" })
      .populate({
        path: "admission",
        select: "batch",
        populate: {
          path: "batch",
          select: "batchNo",
        },
      })
      .populate({
        path: "admission",
        select: "course",
        populate: {
          path: "course",
          select: "name",
        },
      })
      .select({
        __v: 0,
      });
    res.status(200).json(student);
  } catch (error) {
    serverError(res, error);
  }
};

const studentByStudentId = async (req, res) => {
  try {
    let id = req.params.studentId;
    const student = await Student.findOne({ studentId: id })
      .populate({ path: "user", select: "fullname" })
      .populate({
        path: "admission",
        select: "batch",
        populate: {
          path: "batch",
          select: "batchNo",
        },
      })
      .populate({
        path: "admission",
        select: "course",
        populate: {
          path: "course",
          select: "name",
        },
      })
      .select({
        __v: 0,
      });
    res.status(200).json(student);
  } catch (error) {
    serverError(res, error);
  }
};

const register = async (req, res) => {
  try {
    const studentId = await Student.findOne()
      .select({ _id: 0, studentId: 1 })
      .sort({ registeredAt: -1 })
      .limit(1);
    const { studentId: newID } = studentId || { studentId: 201100 }; // Last Student Id Number
    const stdPhone = validMobileNumber(req.body.stdPhone);
    const guardianPhone = validMobileNumber(req.body.guardianPhone) || "";

    let newStudent;
    if (req.files && req.files.length > 0) {
      newStudent = new Student({
        ...req.body,
        studentId: Math.floor(newID) + 1,
        phone: [stdPhone, guardianPhone],
        user: req.user.userid,
        avatar: req.files[0].filename,
      });
    } else {
      newStudent = new Student({
        ...req.body,
        studentId: Math.floor(newID) + 1,
        phone: [stdPhone, guardianPhone],
        user: req.user.userid,
        avatar: null,
      });
    }

    const student = await newStudent.save();
    res.status(201).json({
      message: "New Student Register",
      student,
    });
  } catch (error) {
    serverError(res, error);
  }
};

const updateStudent = async (req, res) => {
  try {
    let { id } = req.params;
    const student = await Student.findById(id);

    const stdPhone = validMobileNumber(req.body.stdPhone);
    const guardianPhone = validMobileNumber(req.body.guardianPhone) || "";

    let avatar = student.avatar;
    if (req.files && req.files.length > 0) {
      if (avatar !== null && avatar !== req.files[0].filename) {
        // check new avatar and remove old avatar
        unlink(
          path.join(__dirname, `/../public/upload/${student.avatar}`),
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
      phone: [stdPhone, guardianPhone],
    };

    const updateData = await Student.findByIdAndUpdate(
      id,
      { $set: updatedData },
      { new: true }
    );

    res.status(200).json({
      message: "Student was updated successfully",
      student: updateData,
    });
  } catch (error) {
    serverError(res, error);
  }
};

const deleteStudent = async (req, res) => {
  try {
    let id = req.params.id;

    const student = await Student.findById(id);

    // remove uploaded files
    if (student.avatar) {
      unlink(
        path.join(__dirname, `/../public/upload/${student.avatar}`),
        (err) => {
          if (err) resourceError(res, err);
        }
      );
    }

    // delete all admission in this student ID
    await Admission.deleteMany({ student: id });

    // remove student ID from Batch
    const batch = Batch.find({ student: { $in: [id] } });
    if (batch.length > 0) {
      await Batch.findByIdAndUpdate(
        { _id: batch._id },
        { $pull: { student: id } }
      );
    }

    // finally delete student
    await Student.findByIdAndDelete(id);
    res.status(200).json({ message: "Student was deleted!" });
  } catch (error) {
    serverError(res, error);
  }
};

module.exports = {
  allStudents,
  studentById,
  studentByStudentId,
  register,
  updateStudent,
  deleteStudent,
};
