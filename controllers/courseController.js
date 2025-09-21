const Course = require("../models/Course");
const { serverError } = require("../utilities/error");

const allCourses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let search = req.query.search || null;
    const searchQuery = {
      $or: [
        { courseType: search },
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ],
    };
    search = search ? searchQuery : {};

    const total = await Course.count(search);
    const courses = await Course.find(search)
      .select({
        __v: 0,
      })
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 });
    res.status(200).json({ courses, total });
  } catch (error) {
    serverError(res, error);
  }
};

const courseById = async (req, res) => {
  try {
    let id = req.params.id;
    const course = await Course.findById(id).select({ __v: 0 });
    res.status(200).json(course);
  } catch (error) {
    serverError(res, error);
  }
};

const newCourse = async (req, res) => {
  try {
    const newCourse = new Course(req.body);
    const course = await newCourse.save();
    res.status(201).json({
      message: "New Course added successfully",
      course,
    });
  } catch (error) {
    serverError(res, error);
  }
};

const updateCourse = async (req, res) => {
  try {
    let { id } = req.params;
    const updateData = await Course.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    );

    res.status(200).json({
      message: "Course was updated successfully",
      course: updateData,
    });
  } catch (error) {
    serverError(res, error);
  }
};

const deleteCourse = async (req, res) => {
  try {
    let id = req.params.id;
    await Course.findByIdAndDelete(id);
    res.status(200).json({ message: "Course was deleted!" });
  } catch (error) {
    serverError(res, error);
  }
};

module.exports = {
  allCourses,
  courseById,
  newCourse,
  updateCourse,
  deleteCourse,
};
