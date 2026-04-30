const { serverError, resourceError } = require("../utilities/error");
const { sendSMS, smsBalance } = require("../utilities/sendMessages");
const Employee = require("../models/Employee");
const Student = require("../models/Student");
const Batch = require("../models/Batch");

const sendMessage = async (req, res) => {
  try {
    let findNumbers = [];
    const { number, status, message } = req.body;

    if (status === "student") {
      const student = await Student.findOne({ studentId: number }).select(
        "phone"
      );
      if (!student) {
        return resourceError(res, { general: "Student not found." });
      }
      findNumbers.push(student.phone[0]);
    }

    if (status === "employee") {
      const employee = await Employee.findOne({
        $or: [{ fullName: number }, { phone: number }]
      }).select("phone");
      if (!employee) {
        return resourceError(res, { general: "Employee not found." });
      }
      findNumbers.push(...employee.phone);
    }

    if (status === "batch") {
      const batch = await Batch.findOne({ batchNo: number })

      if (!batch) {
        return resourceError(res, { general: "Batch not found." });
      }

      if (!batch.student || batch.student.length === 0) {
        return resourceError(res, { general: "Student not exist in this Batch." });
      }

      const students = await Student.find({
        studentId: { $in: batch.student }
      }).select("phone");

      const phoneList = students
        .flatMap(std => std.phone)     // প্রতিটি student.phone অ্যারে, তাই flatMap
        .filter(Boolean);
      findNumbers.push(...phoneList);
    }

    findNumbers = [...new Set(findNumbers)];
    const numbers = findNumbers.map(num => `88${num}`).toString();

    // Send SMS for multiple number separate by comma exemple : '8801816426093,8801716426093'
    const data = await sendSMS({ numbers, message });

    if (data === 5201) {
      return resourceError(res, { general: "API not valid." });
    } else if (data === 5202) {
      return resourceError(res, { general: "API not Active." });
    } else if (data === 5203) {
      return resourceError(res, { general: "Sender Id not valid." });
    } else if (data === 5204) {
      return resourceError(res, { general: "Test Body not valid." });
    } else if (data === 5205) {
      return resourceError(res, { general: "Contact Numbers Not Valid." });
    } else if (data === 5206) {
      return resourceError(res, { general: "Insuficient Balance." });
    } else if (data === 5207) {
      return resourceError(res, {
        general: "Insuficient Balance of your seller (The person opned your account)."
      });
    } else if (data === 5208) {
      return resourceError(res, { general: "Account Not Active." });
    } else if (data === 5209) {
      return resourceError(res, { general: "Account Expired." });
    }

    res.status(200).json({
      success: true,
      message: "Your message was sent successfully!"
    });
  } catch (error) {
    serverError(res, error);
  }
};

const balance = async (req, res) => {
  try {
    const data = await smsBalance();
    res.status(200).json(data);
  } catch (error) {
    serverError(res, error);
  }
}

module.exports = { sendMessage, balance };