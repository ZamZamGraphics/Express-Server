const dotenv = require("dotenv");
dotenv.config();
const allowedOrigins = [process.env.API_URL, process.env.APP_URL];

module.exports = allowedOrigins;
