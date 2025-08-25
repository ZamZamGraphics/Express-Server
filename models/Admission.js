const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const admissionSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: "Student" },
  course: {
    id: String,
    name: String,
    courseType: String,
    courseFee: String,
  },
  batchNo: String,
  discount: Number,
  payableAmount: Number,
  nextPay: Date,
  timeSchedule: String,
  status: {
    type: String,
    enum: ["Unpaid", "Advanced", "Paid", "Canceled"],
    default: "Advanced",
  },
  paymentHistory: [
    {
      date: { type: Date, default: Date.now },
      method: String,
      transactionId: String,
      amount: Number
    }
  ],
  user: { type: Schema.Types.ObjectId, ref: "User" },
  admitedAt: { type: Date, default: Date.now },
});

const Admission = mongoose.model("Admission", admissionSchema);

module.exports = Admission;
