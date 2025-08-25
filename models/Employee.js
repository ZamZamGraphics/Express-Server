const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const employeeSchema = new Schema({
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
        type: String,
        required: true,
        trim: true,
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
    nid: String,
    designation: String,
    bloodGroup: String,
    education: String,
    status: {
        type: String,
        enum: ["Full Time", "Part Time", "Fixed Term", "Intern", "Resigned", "Terminated"],
        default: "Intern",
    },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    registeredAt: { type: Date, default: Date.now },
});

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;
