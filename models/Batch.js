const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const batchSchema = new Schema({
  batchNo: {
    type: Number,
    required: true,
    unique: true,
  },
  courseId: { type: Schema.Types.ObjectId, ref: "Course" },
  studentIds: [{ type: Schema.Types.ObjectId, ref: "Student" }],
  startDate: Date,
  endDate: Date,
  status: {
    type: String,
    enum: ["Upcoming", "Running", "Completed"],
    default: "Upcoming",
  },
  classDays: String,
  classTime: String,
});

const Batch = mongoose.model("Batch", batchSchema);

module.exports = Batch;
