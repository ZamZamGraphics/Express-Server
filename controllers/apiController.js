const Admission = require("../models/Admission");
const Student = require("../models/Student");
const Batch = require("../models/Batch");
const { serverError, resourceError } = require("../utilities/error");

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
    const finalResult = {
      name: result?.student?.fullName,
      id: result?.student?.studentId,
      avatar: result?.student?.avatar,
      fathersName: result?.student?.fathersName,
      mothersName: result?.student?.mothersName,
      address: result?.student?.address?.present,
      mobile: result?.student?.phone[0],
      status: "Completed",
      batch: batch?.batchNo,
      courseName: batch?.course?.name,
      duration: "3 Months",
    };
    res.status(200).json({ student: finalResult });
  } catch (error) {
    serverError(res, error);
  }
};

module.exports = {
  findStudent,
};
