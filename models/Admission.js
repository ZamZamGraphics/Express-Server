const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const admissionSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student" },
    course: { type: Schema.Types.ObjectId, ref: "Course" },
    batch: { type: Schema.Types.ObjectId, ref: "Batch" },
    discount: Number,
    payableAmount: Number,
    payment: Number,
    due: Number,
    nextPay: Date,
    timeSchedule: String,
    paymentType: {
      type: String,
      enum: ["New", "Payment"],
    },
    user: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

const Admission = mongoose.model("Admission", admissionSchema);

module.exports = Admission;
