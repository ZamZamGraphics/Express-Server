const { balance, sendMessage } = require("../controllers/messagesController");
const { smsValidators, smsValidationHandler } = require("../validator/smsValidator");

const router = require("express").Router();

router.get( "/sms/balance", balance);
router.post( "/sms", smsValidators, smsValidationHandler, sendMessage );

module.exports = router;