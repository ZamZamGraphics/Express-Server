const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const batchSchema = new Schema({
  batchNo: {
    type: String,
    required: true,
    unique: true,
  },
  course: { 
    id: String, 
    name: String, 
    courseType: String
  },
  student: [
    { type: String }
  ],
  startDate: Date,
  endDate: Date,
  classDays: String,
  classTime: String,
});

const Batch = mongoose.model("Batch", batchSchema);

module.exports = Batch;
