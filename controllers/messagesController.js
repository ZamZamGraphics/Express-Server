const { serverError, resourceError } = require("../utilities/error");
const sendSMS = require("../utilities/sendMessages");

const sendMessage = async (req, res) => {
  try {
    const { numbers, messages } = req.body;
    const stdNumbers = numbers.map(num => `88${num}`).toString();

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

    res.status(201).json({
      success: true, 
      message: "Your message was sent successfully!"
    });
  } catch (error) {
    console.log(error);
    serverError(res, error);
  }
};

module.exports = {sendMessage};