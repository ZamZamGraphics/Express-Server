const Batch = require("../models/Batch");
const Course = require("../models/Course");
const Student = require("../models/Student");
const { serverError, resourceError } = require("../utilities/error");

const allBatches = async (req, res) => {
  try {
    const limit = req.query.limit || 0;
    const page = req.query.page || 0;
    let search = req.query.search || null;

    const searchQuery = {
      $or: [
        { batchNo: search },
        { status: search },
        { classDays: { $regex: search, $options: "i" } },
        { classTime: { $regex: search, $options: "i" } },
      ],
    };
    search = search ? searchQuery : {};
    const batches = await Batch.find(search)
      .select({
        __v: 0,
      })
      // batchess?page=1&limit=10&search=value
      .skip(limit * page) // Page Number * Show Par Page
      .limit(limit) // Show Par Page
      .sort({ startDate: -1 }); // Last User is First
    res.status(200).json({ batches });
  } catch (error) {
    serverError(res, error);
  }
};

const batchById = async (req, res) => {
  try {
    let id = req.params.id;
    const batch = await Batch.findById(id).select({ __v: 0 });
    res.status(200).json(batch);
  } catch (error) {
    serverError(res, error);
  }
};

const newBatch = async (req, res) => {
  try {
    const { studentIds } = req.body;
    const ids = studentIds.split(",");
    const student = await Student.find({ studentId: { $in: ids } }).select(
      "_id"
    );

    if (student === undefined || student.length == 0) {
      return resourceError(res, { message: "The Student ID is Wrong!" });
    }

    const course = await Course.findById({ _id: req.body.courseId });
    const duration = course.duration.split(" ")[0] * 30;
    const date = new Date(req.body.startDate);
    const endDate = new Date(date.setDate(date.getDate() + duration));

    const newBatch = new Batch({
      ...req.body,
      studentIds: student,
      endDate,
    });
    const batch = await newBatch.save();
    // create admission and update status in student collection
    res.status(201).json({
      message: "New Batch added successfully",
      batch,
    });
  } catch (error) {
    serverError(res, error);
  }
};

const updateBatch = async (req, res) => {
  try {
    let { id } = req.params;
    const { studentIds, startDate, classDays, classTime } = req.body;
    const ids = studentIds.split(",");
    const student = await Student.find({ studentId: { $in: ids } }).select(
      "_id"
    );

    if (student === undefined || student.length == 0) {
      return resourceError(res, { message: "The Student ID is Wrong!" });
    }

    const batch = await Batch.findById(id);
    const course = await Course.findById({ _id: batch.courseId });
    const duration = course.duration.split(" ")[0] * 30;
    const date = new Date(req.body.startDate);
    const endDate = new Date(date.setDate(date.getDate() + duration));

    const updatedBatch = {
      studentIds: student,
      startDate,
      endDate,
      classDays,
      classTime,
    };

    const updateData = await Batch.findByIdAndUpdate(
      id,
      { $set: updatedBatch },
      { new: true }
    );
    // update status in student collection
    res.status(200).json({
      message: "Batch was updated successfully",
      updateData,
    });
  } catch (error) {
    serverError(res, error);
  }
};

const deleteBatch = async (req, res) => {
  try {
    let id = req.params.id;
    await Batch.findByIdAndDelete(id);
    res.status(200).json({ message: "Batch was deleted!" });
  } catch (error) {
    serverError(res, error);
  }
};

module.exports = {
  allBatches,
  batchById,
  newBatch,
  updateBatch,
  deleteBatch,
};
