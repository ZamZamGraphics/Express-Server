const nodemailer = require("nodemailer");

// Replace with your SMTP credentials
const smtpOptions = {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
};

const sendEmail = (data) => {
  const transporter = nodemailer.createTransport(smtpOptions);
  return transporter.sendMail({
    from: `${process.env.SITE_NAME} ${process.env.EMAIL_USERNAME}`,
    ...data,
  });
};

module.exports = sendEmail;
