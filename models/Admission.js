const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const admissionSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student" },
    course: { 
      id: String, 
      name: String, 
      courseType: String
    },
    batchNo: String,
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
    user: String
  },
  {
    timestamps: true,
  }
);

const Admission = mongoose.model("Admission", admissionSchema);

module.exports = Admission;
