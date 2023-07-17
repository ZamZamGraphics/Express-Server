const Admission = require("../models/Admission");
const Student = require("../models/Student");
const Course = require("../models/Course");
const Batch = require("../models/Batch");
const { serverError, resourceError } = require("../utilities/error");

const allAdmission = async (req, res) => {
  try {
    const limit = req.query.limit || 0;
    const page = req.query.page || 0;
    let search = req.query.search || null;

    const searchQuery = {
      $or: [
        { studentId: search },
        { fullName: { $regex: search, $options: "i" } },
        { paymentType: search },
        { status: search },
      ],
    };
    search = search ? searchQuery : {};
    const admission = await Admission.find(search)
      // .populate({ path: "student", select: "studentId fullName status" })
      // .populate({ path: "course" })
      // .populate({ path: "batch" })
      .populate({ path: "user", select: "fullname" })
      .select({
        __v: 0,
      })
      // students?page=1&limit=10&search=value
      .skip(limit * page) // Page Number * Show Par Page
      .limit(limit) // Show Par Page
      .sort({ createdAt: -1 }); // Last User is First
    res.status(200).json({ admission });
  } catch (error) {
    serverError(res, error);
  }
};

const admissionById = async (req, res) => {
  try {
    let id = req.params.id;
    const admission = await Admission.findById(id).select({ __v: 0 });
    res.status(200).json(admission);
  } catch (error) {
    serverError(res, error);
  }
};

const newAdmission = async (req, res) => {
  try {
    const { student, course, discount, payment, batch, timeSchedule } =
      req.body;

    const studentDetails = await Student.findOne({ studentId: student });
    const batchDetails = await Batch.findOne({ batchNo: batch });
    const courseDetails = await Course.findById({ _id: course });

    let batchId;

    if (!studentDetails) {
      return resourceError(res, { message: "The Student ID is Wrong!" });
    }

    if (!batchDetails) {
      // create new batch
      batchId = await createNewBatch(
        batch,
        courseDetails,
        studentDetails,
        timeSchedule
      );
    } else {
      if (JSON.stringify(batchDetails.course) !== JSON.stringify(course)) {
        return resourceError(res, { message: "Course Name did not matched!" });
      }
      batchId = batchNo._id;
      // batch update
      await Batch.findByIdAndUpdate(batchId, {
        $addToSet: { student: studentId._id },
      });
    }

    const courseFee = courseId.courseFee;
    const payableAmount = courseFee - (discount || 0);
    const due = payableAmount - payment;

    const newAdmission = new Admission({
      ...req.body,
      studentId: student._id,
      batchNo: batchId,
      payableAmount,
      due,
      userId: req.user.userid,
    });

    // new admission
    const admission = await newAdmission.save();
    // student due update
    await Student.findByIdAndUpdate(student._id, {
      $addToSet: { admission: admission._id },
      $set: { totalDues: due + student.totalDues },
    });

    res.status(201).json({
      message: "New Admission Success!",
      admission,
    });
  } catch (error) {
    serverError(res, error);
  }
};

const deleteAdmission = async (req, res) => {
  try {
    let id = req.params.id;
    // find Last Admited
    // remove student ID from Batch

    // update student due in Student

    // finally delete admission

    // await Admission.findByIdAndDelete(id);
    res.status(200).json({ message: "Admission was deleted!" });
  } catch (error) {
    serverError(res, error);
  }
};

const createNewBatch = async (batchNo, course, student, timeSchedule) => {
  try {
    const duration = course.duration.split(" ")[0] * 30;
    const date = new Date();
    const startDate = new Date(date.setDate(date.getDate() + 20));
    const endDate = new Date(startDate.setDate(startDate.getDate() + duration));
    const classDays = "Sat, Mon, Wed";

    const studentId = student._id;

    const newBatch = new Batch({
      batchNo,
      courseId: course._id,
      studentIds: [studentId],
      startDate,
      endDate,
      classDays,
      classTime: timeSchedule,
    });
    const batch = await newBatch.save();
    return batch._id;
  } catch (error) {
    serverError(res, error);
  }
};

module.exports = {
  allAdmission,
  admissionById,
  newAdmission,
  deleteAdmission,
};
