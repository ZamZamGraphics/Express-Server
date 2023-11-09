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
        { "course.name": { $regex: search, $options: "i" } },
        { paymentType: search },
        { user: search },
        { batchNo: search },
      ],
    };
    search = search ? searchQuery : {};
    const total = await Admission.count(search);
    const admission = await Admission.find(search)
      .populate({
        path: "student",
        select: "studentId avatar fullName address phone status",
      })
      .select({
        __v: 0,
      })
      // students?page=1&limit=10&search=value
      .skip(limit * page) // Page Number * Show Par Page
      .limit(limit) // Show Par Page
      .sort({ createdAt: -1 }); // Last User is First
    res.status(200).json({ admission, total });
  } catch (error) {
    serverError(res, error);
  }
};

const admissionById = async (req, res) => {
  try {
    let id = req.params.id;
    const admission = await Admission.findById(id)
      .populate({
        path: "student",
        select: "studentId avatar fullName address phone status",
      })
      .select({ __v: 0 });
    res.status(200).json(admission);
  } catch (error) {
    serverError(res, error);
  }
};

const newAdmission = async (req, res) => {
  try {
    const {
      student: studentId,
      course: courseId,
      discount,
      payment,
      nextPay,
      batch: batchNo,
      timeSchedule,
    } = req.body;

    const student = await Student.findOne({ studentId });
    const batch = await Batch.findOne({ batchNo });
    const course = await Course.findById({ _id: courseId });

    let batchId;

    if (!student) {
      return resourceError(res, { message: "The Student ID is Wrong!" });
    }

    if (!batch) {
      // create new batch
      batchId = await createNewBatch(batchNo, course, student, timeSchedule);
    } else {
      if (JSON.stringify(batch.course.id) !== JSON.stringify(courseId)) {
        return resourceError(res, { message: "Course Name did not matched!" });
      }
      batchId = batch._id;
      // batch update
      await Batch.findByIdAndUpdate(
        { _id: batchId },
        {
          $addToSet: { student: student.studentId },
        }
      );
    }

    const courseFee = course.courseFee;
    const payableAmount = courseFee - (discount || 0);
    const due = payableAmount - payment;
    const date = new Date();
    const nextDate = new Date(date.setDate(date.getDate() + 15));

    let nextPayment = nextPay;
    if (!nextPay && due > 0) {
      nextPayment = nextDate;
    }

    const newAdmission = new Admission({
      ...req.body,
      student: student._id,
      course: {
        id: course._id,
        name: course.name,
        courseType: course.courseType,
      },
      batchNo,
      payableAmount,
      due,
      nextPay: nextPayment,
      user: req.user.name,
    });

    // new admission
    const admission = await newAdmission.save();
    // student due update
    await Student.findByIdAndUpdate(
      { _id: student._id },
      {
        $addToSet: { admission: admission._id },
        $set: { status: "Approved", totalDues: due + student.totalDues },
      }
    );

    res.status(201).json({
      message: "New Admission Success!",
      admission,
    });
  } catch (error) {
    serverError(res, error);
  }
};

const payment = async (req, res) => {
  const student = await Student.findOne({ studentId: req.body.student });
  const batch = await Batch.findOne({ batchNo: req.body.batch });

  if (!student) {
    return resourceError(res, { message: "The Student ID is Wrong!" });
  }

  if (!batch) {
    return resourceError(res, { message: "Batch No did not matched!" });
  }

  const admission = await Admission.findOne({
    student: student._id,
    batch: batch.batchNo,
  })
    .sort({ createdAt: -1 })
    .limit(1);

  if (!admission) {
    return resourceError(res, { message: "Batch No did not matched!" });
  }

  const payableAmount = admission.due - (req.body.discount || 0);
  const due = payableAmount - req.body.payment;
  const date = new Date();
  const nextDate = new Date(date.setDate(date.getDate() + 15));
  const nextPay = due > 0 ? nextDate : null;

  const admissionPayment = new Admission({
    ...req.body,
    student: student._id,
    batch: batch.batchNo,
    payableAmount,
    due,
    nextPay,
    user: req.user.name,
  });
  // add New admission by paymentType is payment
  const paymentData = await admissionPayment.save();

  // student due update
  await Student.findByIdAndUpdate(
    { _id: student._id },
    {
      $set: { totalDues: student.totalDues - req.body.payment },
    }
  );

  res.status(200).json({
    message: "Payment Success!",
    admission: paymentData,
  });
};

const deleteAdmission = async (req, res) => {
  try {
    let id = req.params.id;
    // find Last Admited
    const lastAdmited = await Admission.findOne()
      .sort({ createdAt: -1 })
      .limit(1);
    const admission = await Admission.findById(id);
    const student = await Student.findById({ _id: admission.student._id });
    const batch = await Batch.findOne({ batchNo: admission.batchNo });

    if (JSON.stringify(lastAdmited._id) !== JSON.stringify(admission._id)) {
      return resourceError(res, {
        message: "This admission cannot be deleted!",
      });
    }

    // update student due
    if (admission.paymentType == "New") {
      await Student.findByIdAndUpdate(
        { _id: student._id },
        {
          $pull: { admission: admission._id },
          $set: {
            status: "Pending",
            totalDues: admission.due - student.totalDues,
          },
        }
      );

      // remove student ID from Batch
      await Batch.findByIdAndUpdate(
        { _id: batch._id },
        { $pull: { student: student.studentId } }
      );
    } else if (admission.paymentType == "Payment") {
      await Student.findByIdAndUpdate(
        { _id: student._id },
        {
          $set: { totalDues: admission.payment + student.totalDues },
        }
      );
    }

    // finally delete admission
    await Admission.findByIdAndDelete(id);

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

    const newBatch = new Batch({
      batchNo,
      course: {
        id: course._id,
        name: course.name,
        courseType: course.courseType,
      },
      student: [student.studentId],
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
  payment,
  deleteAdmission,
};
