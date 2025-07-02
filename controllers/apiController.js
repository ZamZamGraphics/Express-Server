const Admission = require("../models/Admission");
const Student = require("../models/Student");
const Batch = require("../models/Batch");
const Course = require("../models/Course");
const { serverError, resourceError } = require("../utilities/error");
const dayjs = require("dayjs");
const isBetween = require("dayjs/plugin/isBetween");

dayjs.extend(isBetween);

const findStudent = async (req, res) => {
  try {
    const { studentId, batchNo } = req.query;
    const student = await Student.findOne({ studentId });

    if (!student) {
      return resourceError(res, { message: "Student was not found" });
    }

    const result = await Admission.findOne({
      student: student._id,
      batchNo,
      paymentType: "New",
    })
      .populate({
        path: "student",
        select:
          "studentId avatar fullName fathersName mothersName address phone status",
      })
      .sort({ admitedAt: -1 })
      .limit(1);
    if (!result) {
      return resourceError(res, {
        message: "Student ID & Batch No did not matched!",
      });
    }
    const batch = await Batch.findOne({ batchNo: batchNo });
    const course = await Course.findById(batch.course.id);

    const batchStatus = dayjs().isBetween(
      dayjs(batch.startDate),
      dayjs(dayjs(batch.endDate))
    )
      ? "Running"
      : dayjs().isBefore(dayjs(batch.startDate))
      ? "Upcoming"
      : "Completed";

    const finalResult = {
      name: result?.student?.fullName,
      id: result?.student?.studentId,
      avatar: result?.student?.avatar,
      fathersName: result?.student?.fathersName,
      mothersName: result?.student?.mothersName,
      address: result?.student?.address?.present,
      mobile: result?.student?.phone[0],
      status: batchStatus,
      batch: batch?.batchNo,
      courseName: course?.name,
      duration: course?.duration,
    };
    res.status(200).json({ student: finalResult });
  } catch (error) {
    serverError(res, error);
  }
};

module.exports = {
  findStudent,
};
