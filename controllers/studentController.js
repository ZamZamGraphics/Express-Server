const Student = require("../models/Student");
const { serverError, resourceError } = require("../utilities/error");

const allStudents = async (req, res) => {
  try {
    const student = await Student.find();
    res.status(200).json({
      message: "All Students",
      student,
    });
  } catch (error) {
    serverError(res, error);
  }
};

const studentById = (req, res) => {
  res.status(200).json({
    message: "Student By Id",
  });
};

const register = (req, res) => {
  try {
    const student = new Student({
      ...req.body,
      user: req.user.userid,
    });
    res.status(200).json({
      message: "New Student Register",
      student,
    });
  } catch (error) {
    serverError(res, error);
  }
};

const updateStudent = (req, res) => {
  res.status(200).json({
    message: "Update Student",
  });
};

const deleteStudent = (req, res) => {
  res.status(200).json({
    message: "Delete Student",
  });
};

module.exports = {
  allStudents,
  studentById,
  register,
  updateStudent,
  deleteStudent,
};
