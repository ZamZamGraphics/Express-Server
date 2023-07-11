const Student = require("../models/Student");
const { serverError } = require("../utilities/error");

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
        { refrence: { $regex: search, $options: "i" } },
        { status: search },
      ],
    };
    search = search ? searchQuery : {};
    const student = await Student.find(search)
      .select({
        __v: 0,
      })
      // students?page=1&limit=10&search=value
      .skip(limit * page) // Page Number * Show Par Page
      .limit(limit) // Show Par Page
      .sort({ registeredAt: -1 }); // Last User is First
    res.status(200).json({ student });
  } catch (error) {
    serverError(res, error);
  }
};

const studentById = async (req, res) => {
  try {
    let id = req.params.id;
    const user = await Student.findById(id).select({ __v: 0 });
    res.status(200).json(user);
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
    const { studentId: newID } = studentId || { studentId: 201886 }; // Last Student Id Number
    const newStudent = new Student({
      ...req.body,
      studentId: Math.floor(newID) + 1,
      user: req.user.userid,
    });
    const student = await newStudent.save();
    res.status(200).json({
      message: "New Student Register",
      newStudent,
    });
  } catch (error) {
    serverError(res, error);
  }
};

const updateStudent = async (req, res) => {
  try {
    let { id } = req.params;
    const updateData = await Student.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    );

    res.status(200).json({
      message: "Student was updated successfully",
      updateData,
    });
  } catch (error) {
    serverError(res, error);
  }
};

const deleteStudent = async (req, res) => {
  try {
    let id = req.params.id;
    await Student.findByIdAndDelete(id);
    res.status(200).json({ message: "Student was deleted!" });
  } catch (error) {
    serverError(res, error);
  }
};

module.exports = {
  allStudents,
  studentById,
  register,
  updateStudent,
  deleteStudent,
};
