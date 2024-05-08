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

    const from = req.query.from || "24-08-2022";
    let to ;
    if(req.query.to){
      to = new Date(req.query.to);
      to = new Date(to.getTime() + ( 3600 * 1000 * 24));
    } else {
      to = new Date(Date.now() + ( 3600 * 1000 * 24));
    }

    const searchQuery = {
      $or: [
        { "student.studentId": search },
        { "student.fullName": { $regex: search, $options: "i" } },
        { "course.name": { $regex: search, $options: "i" } },
        { paymentType: search },
        { batchNo: search },
      ],
    };
    search = search ? searchQuery : {};

    const admission = await Admission.aggregate([
      {
        $lookup: {
          from: "students",
          localField: "student",
          foreignField: "_id",
          as: "student"
        }
      },
      {
        $unwind: "$student"
      },
      {$match:search},
      {$match: {
        $and: [
          { admitedAt: { $gte: new Date(from) } },
          { admitedAt: { $lte: new Date(to) } }
        ]
      }},
      { $sort: { admitedAt: -1 } },
      { $skip: limit * page },
      { $limit: parseInt(limit) }
    ])
    res.status(200).json(admission);
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
      .populate({
        path: "user",
        select: "fullname",
      })
      .select({ __v: 0 });
    res.status(200).json(admission);
  } catch (error) {
    serverError(res, error);
  }
};

const fineByStdId = async (req, res) => {
  const { studentId, batchNo } = req.params;
  const student = await Student.findOne({ studentId });
  let admission = null;
  if (student) {
    admission = await Admission.findOne({
      student: student._id,
      batchNo,
    })
      .populate({
        path: "student",
        select: "studentId avatar fullName address phone status",
      })
      .sort({ admitedAt: -1 })
      .limit(1);
    if (!admission) {
      return resourceError(res, {
        message: "Student ID & Batch No did not matched!",
      });
    }
  }

  res.status(200).json({ admission });
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
        courseFee: course.courseFee,
      },
      batchNo,
      payableAmount,
      due,
      nextPay: nextPayment,
      user: req.user.userid,
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
  const {
    batch: batchNo,
    student: studentId,
    discount,
    payment,
    nextPay,
  } = req.body;

  const student = await Student.findOne({ studentId });
  const batch = await Batch.findOne({ batchNo });

  if (!student) {
    return resourceError(res, { message: "The Student ID is Wrong!" });
  }

  if (!batch) {
    return resourceError(res, { message: "Batch No did not matched!" });
  }

  const admission = await Admission.findOne({
    student: student._id,
    batchNo: batch.batchNo,
  })
    .sort({ admitedAt: -1 })
    .limit(1);

  if (!admission) {
    return resourceError(res, {
      message: "Student ID & Batch No did not matched!",
    });
  }

  const payableAmount = admission.due - (discount || 0);
  const due = payableAmount - payment;
  const date = new Date();
  const nextDate = new Date(date.setDate(date.getDate() + 15));

  let nextPayment = nextPay;
  if (!nextPay && due > 0) {
    nextPayment = nextDate;
  }

  const admissionPayment = new Admission({
    batchNo,
    student: student._id,
    course: admission.course,
    discount,
    payableAmount,
    payment,
    due,
    nextPay: nextPayment,
    paymentType: "Payment",
    timeSchedule: admission.timeSchedule,
    user: req.user.userid,
  });

  // add New admission by paymentType is payment
  const paymentData = await admissionPayment.save();

  let totalDues = parseInt(payment) + parseInt(discount || 0);

  // student due update
  await Student.findByIdAndUpdate(
    { _id: student._id },
    {
      $set: { totalDues: student.totalDues - totalDues },
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
    const admission = await Admission.findById(id);
    const lastAdmited = await Admission.findOne({
      student: admission.student,
    })
      .sort({ admitedAt: -1 })
      .limit(1);
    const student = await Student.findById({ _id: lastAdmited.student._id });
    const batch = await Batch.findOne({ batchNo: lastAdmited.batchNo });

    if (JSON.stringify(lastAdmited._id) !== JSON.stringify(admission._id)) {
      return resourceError(res, {
        message: "This admission cannot be deleted!",
      });
    }

    const filteredAdmisstion = student.admission.filter(
      (admissionId) =>
        JSON.stringify(admissionId) !== JSON.stringify(admission._id)
    );

    // update student due
    if (admission.paymentType == "New") {
      await Student.findByIdAndUpdate(
        { _id: student._id },
        {
          $pull: { admission: admission._id },
          $set: {
            status: filteredAdmisstion.length > 0 ? student.status : "Canceled",
            totalDues: student.totalDues - admission.due,
          },
        }
      );

      // remove student ID from Batch
      await Batch.findByIdAndUpdate(
        { _id: batch._id },
        { $pull: { student: student.studentId } }
      );
    } else if (admission.paymentType == "Payment") {
      const payment = admission.payment + (admission.discount || 0);
      await Student.findByIdAndUpdate(
        { _id: student._id },
        {
          $set: { totalDues: student.totalDues + payment },
        }
      );
    }

    // finally delete admission
    await Admission.findByIdAndDelete(id);

    res.status(200).json({ message: "Admission was deleted!", stdAdmission });
  } catch (error) {
    serverError(res, error);
  }
};

const createNewBatch = async (batchNo, course, student, timeSchedule) => {
  try {
    const duration = course.duration.split(" ")[0] * 30;
    const date = new Date();
    const startDate = new Date(date.setDate(date.getDate() + 10));
    const endDate = new Date(date.setDate(date.getDate() + duration + 10));

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
  fineByStdId,
  newAdmission,
  payment,
  deleteAdmission,
};
