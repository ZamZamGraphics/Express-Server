const Batch = require("../models/Batch");
const Course = require("../models/Course");
const Student = require("../models/Student");
const Admission = require("../models/Admission");
const { serverError, resourceError } = require("../utilities/error");

const allBatches = async (req, res) => {
  try {
    const limit = req.query.limit || 0;
    const page = req.query.page || 0;
    let search = req.query.search || null;

    const searchQuery = {
      $or: [
        { batchNo: search },
        // { startDate: { $lt:  new Date(search) } },
        // { endDate: { $lt: new Date(search) } },
        { classDays: { $regex: search, $options: "i" } },
        { classTime: { $regex: search, $options: "i" } },
      ],
    };
    search = search ? searchQuery : {};
    const total = await Batch.count(search);
    const batches = await Batch.find(search)
      .populate({ path: "course", select: "name courseType" })
      .populate({ path: "student", select: "studentId fullName" })
      .select({
        __v: 0,
      })
      // batchess?page=1&limit=10&search=value
      .skip(limit * page) // Page Number * Show Par Page
      .limit(limit) // Show Par Page
      .sort({ startDate: -1 }); // Last User is First
    res.status(200).json({ batches, total });
  } catch (error) {
    serverError(res, error);
  }
};

const batchById = async (req, res) => {
  try {
    let id = req.params.id;
    const batch = await Batch.findById(id)
      .populate({ path: "course", select: "name courseType" })
      .populate({ path: "student", select: "studentId fullName" })
      .select({ __v: 0 });
    res.status(200).json(batch);
  } catch (error) {
    serverError(res, error);
  }
};

const newBatch = async (req, res) => {
  try {
    const { student } = req.body;
    const ids = student.split(",");
    const studentId = await Student.find({ studentId: { $in: ids } }).select(
      "_id"
    );

    if (studentId === undefined || studentId.length == 0) {
      return resourceError(res, { message: "The Student ID is Wrong!" });
    }

    const course = await Course.findById({ _id: req.body.course });
    const duration = course.duration.split(" ")[0] * 30;
    const date = new Date(req.body.startDate);
    const endDate = new Date(date.setDate(date.getDate() + duration));

    const newBatch = new Batch({
      ...req.body,
      student: studentId,
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
    const batch = await Batch.findById(id);
    const course = await Course.findById({ _id: batch.course });
    const duration = course.duration.split(" ")[0] * 30;
    const date = new Date(req.body.startDate);
    const endDate = new Date(date.setDate(date.getDate() + duration));

    const updateData = await Batch.findByIdAndUpdate(
      id,
      { $set: { ...req.body, endDate } },
      { new: true }
    );
    // update status in student collection
    res.status(200).json({
      message: "Batch was updated successfully",
      batch: updateData,
    });
  } catch (error) {
    serverError(res, error);
  }
};

const deleteBatch = async (req, res) => {
  try {
    let id = req.params.id;
    const admission = await Admission.find({
      batch: id,
      paymentType: "New",
    });
    let student = null;
    let stdIds = null;
    let admissionIds = null;
    if (admission.length > 0) {
      stdIds = admission.map((admission) => admission.student);
      student = await Student.find({ _id: { $in: stdIds } }).select("_id");
      stdIds = student.map((std) => std._id);

      admissionIds = admission.map((admission) => admission._id);
      // Student due update korte hobe
      student = await Student.updateMany(
        { _id: { $in: stdIds } },
        {
          $pull: { admission: { $in: admissionIds } },
          $set: { status: "Pending", totalDues: 0 },
        },
        { multi: true }
      );
      // delete all admission in this studentIds
      await Admission.deleteMany({ batch: id });
    }

    // finally batch delete
    await Batch.findByIdAndDelete(id);

    res.status(200).json({ message: "Batch was deleted!" });
  } catch (error) {
    console.log(error);
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
