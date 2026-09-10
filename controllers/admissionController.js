const Admission = require("../models/Admission");
const Student = require("../models/Student");
const Course = require("../models/Course");
const Batch = require("../models/Batch");
const { serverError, resourceError } = require("../utilities/error");
const { sendSMS } = require("../utilities/sendMessages");

const allAdmission = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || "lastPaymentDate";
    const sortOrder = req.query.sortOrder || -1;

    // Date filter
    const dateFilter = {};
    if (req.query.from) {
      dateFilter.$gte = new Date(req.query.from);
    }
    if (req.query.to) {
      const endDate = new Date(req.query.to);
      endDate.setHours(23, 59, 59, 999); // include full day
      dateFilter.$lte = endDate;
    }

    let search = req.query.search || null;
    const searchQuery = {
      $or: [
        { "student.studentId": search },
        { "student.fullName": { $regex: search, $options: "i" } },
        { "course.name": { $regex: search, $options: "i" } },
        { batchNo: search },
      ],
    };
    search = search ? searchQuery : {};

    const matchStage = { ...search };
    if (Object.keys(dateFilter).length > 0) {
      matchStage.admitedAt = dateFilter;
    }

    const result = await Admission.aggregate([
      {
        $lookup: {
          from: "students",
          localField: "student",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      { $match: matchStage },
      { $addFields: { lastPaymentDate: { $max: "$paymentHistory.date" } } },
      {
        $facet: {
          admission: [
            { $sort: { [sortBy]: sortOrder } },
            { $skip: skip },
            { $limit: parseInt(limit) },
            { $project: { lastPaymentDate: 0 } }
          ],
          total: [{ $count: "total" }],
        },
      },
      { $addFields: { total: { $ifNull: [{ $arrayElemAt: ["$total.total", 0] }, 0] } } },
      { $replaceRoot: { newRoot: { admission: "$admission", total: "$total" } } }
    ]);
    res.status(200).json(result[0]);
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

const findByStdId = async (req, res) => {
  try {
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
    }

    if (!admission) {
      return resourceError(res, {
        message: "Student ID & Batch No did not matched!",
      });
    }
    res.status(200).json({ success: true, admission });

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
      method,
      transactionId
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
      student: student._id,
      course: {
        id: course._id,
        name: course.name,
        courseType: course.courseType,
        courseFee: course.courseFee,
      },
      batchNo,
      discount,
      payableAmount,
      nextPay: nextPayment,
      paymentHistory: [
        {
          date: new Date(),
          amount: payment,
          method,
          transactionId,
        }
      ],
      timeSchedule,
      user: req.user.userid,
    });

    // new admission
    const admission = await newAdmission.save();

    // Send SMS for multiple number separate by comma exemple : '8801816426093,8801716426093'
    sendSMS({
      numbers: `88${student.phone[0]}`,
      message: `প্রিয় শিক্ষার্থী, ${course.name} কোর্সে আপনার ভর্তি সম্পন্ন হয়েছে। আইডি নং ${studentId} ব্যাচ নং-${batchNo} শীঘ্রই আপনার ক্লাসের সময়সূচী অফিস থেকে নিশ্চিত করা হবে। ধন্যবাদ। আল-মদিনা আইটি 01736722622`,
    });

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
    method,
    transactionId,
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
  });

  if (!admission) {
    return resourceError(res, {
      message: "Student ID & Batch No did not matched!",
    });
  }

  const courseFee = admission?.course?.courseFee;
  const totalPay = admission?.paymentHistory?.reduce((total, history) => {
    return total + history.amount
  }, 0);

  const less = parseInt(admission?.discount) + parseInt(discount || 0);
  const prevDue = parseInt(admission?.payableAmount) - totalPay;
  const subTotal = prevDue - discount;

  const due = subTotal - payment;
  const date = new Date();
  const nextDate = new Date(date.setDate(date.getDate() + 15));

  let nextPayment = nextPay;
  if (!nextPay && due > 0) {
    nextPayment = nextDate;
  }

  const admissionId = admission?._id;
  const updateData = await Admission.findByIdAndUpdate(
    { _id: admissionId },
    {
      $set: {
        discount: less,
        nextPay: nextPayment,
        payableAmount: courseFee - less,
        status: due > 0 ? "Advanced" : "Paid"
      },
      $push: {
        paymentHistory: {
          date: new Date(),
          amount: payment,
          method,
          transactionId,
        }
      },
    },
    { new: true }
  );

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
    admission: updateData,
  });
};

const deleteAdmission = async (req, res) => {
  try {
    let id = req.params.id;
    const admission = await Admission.findById(id);
    const student = await Student.findById({ _id: admission.student._id });
    const batch = await Batch.findOne({ batchNo: admission.batchNo });

    const filteredAdmisstion = student.admission.filter(
      (admissionId) =>
        JSON.stringify(admissionId) !== JSON.stringify(admission._id)
    );

    const totalPay = admission?.paymentHistory?.reduce((total, history) => {
      return total + history.amount
    }, 0);
    const due = admission?.payableAmount - totalPay;

    // update student due
    await Student.findByIdAndUpdate(
      { _id: student._id },
      {
        $pull: { admission: admission._id },
        $set: {
          status: filteredAdmisstion.length > 0 ? student.status : "Canceled",
          totalDues: student.totalDues - due,
        },
      }
    );

    // remove student ID from Batch
    await Batch.findByIdAndUpdate(
      { _id: batch._id },
      { $pull: { student: student.studentId } }
    );

    // finally delete admission
    await Admission.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "Admission was deleted!" });
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

const migratePaymentsBulk = async (req, res) => {
  try {
    // updateMany + aggregation pipeline
    const result = await Admission.updateMany(
      { payment: { $exists: true } }, // শুধু যাদের payment আছে
      [
        {
          $set: {
            // paymentHistory যদি না থাকে, নতুন array create করবে
            paymentHistory: {
              $concatArrays: [
                { $ifNull: ["$paymentHistory", []] },
                [
                  {
                    date: "$admitedAt",
                    amount: "$payment",
                    method: "Cash",
                    transactionId: null,
                  },
                ],
              ],
            },
          },
        },
        { $unset: ["payment", "paymentType", "due"] }, // optional: remove old payment field
      ]
    );

    res.status(200).json({ message: "Migration completed", result });
  } catch (error) {
    console.log(error)
    serverError(res, error);
  }
};

module.exports = {
  allAdmission,
  admissionById,
  findByStdId,
  newAdmission,
  payment,
  deleteAdmission,
  migratePaymentsBulk
};
