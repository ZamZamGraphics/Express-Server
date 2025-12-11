const axios = require('axios');
const createError = require("http-errors");

const smsOptions = {
    url: process.env.SMSURL + "/send",
    apiKey: process.env.APIKEY,
    senderId: process.env.SENDERID,
};

const sendSMS = async ({ numbers, message }) => {
    try {
        const { data } = await axios.get(smsOptions.url, {
            params: {
                apiKey: smsOptions.apiKey,
                senderId: smsOptions.senderId,
                contactNumbers: numbers,
                textBody: message,
            }
        })
        return data;
    } catch (error) {
        createError(error.message);
    };
}

const smsBalance = async () => {
    try {
        const url = process.env.SMSURL + "/balance?apiKey=" + process.env.APIKEY;
        const { data } = await axios.get(url);
        return data;
    } catch (error) {
        createError(error.message);
    };
}

module.exports = { sendSMS, smsBalance };