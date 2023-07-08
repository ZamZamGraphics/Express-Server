const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const studentSchema = new Schema({
  studentId: {
    type: Number,
    unique: true,
  },
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
  address: [
    {
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
  ],
  birthDay: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
    enum: ["Mail", "Femail"],
  },
  phone: [
    {
      type: String,
      minlength: 11,
      maxlength: 11,
    },
  ],
  email: {
    type: String,
    lowercase: true,
  },
  occupation: String,
  nid: {
    type: Number,
    min: 10,
    max: 17,
  },
  nid: {
    type: Number,
    min: 17,
    max: 17,
  },
  bloodGroup: String,
  education: String,
  refrence: String,
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
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  due: Number,
  registeredAt: { type: Date, default: Date.now },
});

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
