const { serverError, resourceError } = require("../utilities/error");
const { sendSMS, smsBalance } = require("../utilities/sendMessages");
const Student = require("../models/Student");
const Batch = require("../models/Batch");

const sendMessage = async (req, res) => {
  try {
    const { studentId, batchNo, messages } = req.body;
    let numbers = null;

    if(!studentId && batchNo || studentId && batchNo) {
      const batch = await Batch.findOne({batchNo})
      if(batch) {
        if(batch.student.length > 0) {
          const students = await Student.find({ studentId: { $in: batch.student } }).select(
            "phone"
          );
          numbers = students.reduce((prev, curentStd) => {
            return prev.concat(curentStd.phone);
          }, []).filter(Boolean);
        } else {
          return resourceError(res, { message: "Student not exist in this Batch." });
        }
      } else {
        return resourceError(res, { message: "Batch not found." });
      }
    } else if(studentId && !batchNo) {
      const students = await Student.find({ studentId: { $in: studentId } }).select(
        "phone"
      );
      numbers = students.reduce((prev, curentStd) => {
        return prev.concat(curentStd.phone);
      }, []).filter(Boolean);
    } else {
      return resourceError(res, { message: "Please Select Student ID or Put Batch No." });
    }
    
    const stdNumbers = numbers && numbers.map(num => `88${num}`).toString();

    // Send SMS for multiple number separate by comma exemple : '8801816426093,8801716426093'
    const data = await sendSMS({
      numbers: stdNumbers,
      messages: messages
    });
    
    if (data === 5201) {
      return resourceError(res, {
        message: "API not valid.",
      });
    } else if(data === 5202) {
      return resourceError(res, {
        message: "API not Active.",
      });
    } else if(data === 5203) {
      return resourceError(res, {
        message: "Sender Id not valid."
      });
    } else if(data === 5204) {
      return resourceError(res, {
        message: "Test Body not valid."
      });
    } else if(data === 5205) {
      return resourceError(res, {
        message: "Contact Numbers Not Valid."
      });
    } else if(data === 5206) {
      return resourceError(res, {
        message: "Insuficient Balance."
      });
    } else if(data === 5207) {
      return resourceError(res, {
        message: "Insuficient Balance of your seller (The person opned your account)."
      });
    } else if(data === 5208) {
      return resourceError(res, {
        message: "Account Not Active."
      });
    } else if(data === 5209) {
      return resourceError(res, {
        message: "Account Expired."
      });
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
  try{
    const data = await smsBalance();
    res.status(200).json(data);
  } catch (error) {
    serverError(res, error);
  }
}

module.exports = { sendMessage, balance };