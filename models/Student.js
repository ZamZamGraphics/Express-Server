const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const studentSchema = new Schema({
  studentId: String,
  avatar: {
    type: String,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  fathersName: {
    type: String,
    required: true,
    trim: true,
  },
  mothersName: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    present: {
      type: String,
      required: true,
      trim: true,
    },
    permanent: {
      type: String,
      trim: true,
    },
  },
  birthDay: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
    required: true,
    enum: ["Male", "Female"],
  },
  phone: [
    {
      type: String,
    },
  ],
  email: {
    type: String,
    lowercase: true,
  },
  occupation: String,
  nid: String,
  birthCertificate: String,
  bloodGroup: String,
  education: String,
  reference: String,
  status: {
    type: String,
    enum: ["Approved", "Pending", "Rejected"],
    default: "Pending",
  },
  admission: [
    {
      type: Schema.Types.ObjectId,
      ref: "Admission",
    },
  ],
  user: { type: Schema.Types.ObjectId, ref: "User" },
  totalDues: { type: Number, default: 0 },
  registeredAt: { type: Date, default: Date.now },
});

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
