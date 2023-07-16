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
      .populate({ path: "user", select: "fullname" })
      .populate({ path: "student", select: "studentId fullName status" })
      .populate({ path: "course" })
      .populate({ path: "batch" })
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
    const { studentId, courseId, batchNo, timeSchedule } = req.body;
    const student = await Student.findOne({ studentId });
    const course = await Course.findById({ _id: courseId });
    const batch = await Batch.findOne({ batchNo });

    if (!student) {
      return resourceError(res, { message: "The Student ID is Wrong!" });
    }

    if (!batch) {
      const duration = course.duration.split(" ")[0] * 30;
      const date = new Date();
      const startDate = new Date(date.setDate(date.getDate() + 20));
      const endDate = new Date(
        startDate.setDate(startDate.getDate() + duration)
      );
      const classDays = "Sat, Mon, Wed";

      const studentId = student._id;

      const newBatch = new Batch({
        batchNo,
        courseId,
        studentIds: [studentId],
        startDate,
        endDate,
        classDays,
        classTime: timeSchedule,
      });
      console.log(newBatch);
      // create new batch
      //   const batch = await newBatch.save();
      // student due update
      // new admission
    }

    const newAdmission = new Admission({
      ...req.body,
      studentId: student._id,
      batchNo: 123, // collect new batch no
      due: 213, // calcolate due
      user: req.user.userid,
    });
    // batch update
    // student due update
    // new admission
    // const admission = await newAdmission.save();
    res.status(201).json({
      //   message: "New Admission Success!",
      newAdmission,
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

module.exports = {
  allAdmission,
  admissionById,
  newAdmission,
  deleteAdmission,
};
