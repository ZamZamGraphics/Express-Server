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
  tls: {
    // do not fail on invalid certs
    rejectUnauthorized: false,
  },
};

const sendEmail = (data) => {
  const transporter = nodemailer.createTransport(smtpOptions);
  return transporter.sendMail({
    from: `AL MADINA IT ${process.env.EMAIL_USERNAME}`,
    ...data,
  },
    (err, info) => {
      if (err) {
        // console.error(err);
        return {
          success: false,
          error: err
        };
      }
      // console.log(info.envelope);
      // console.log(info.messageId);
      return {
        success: true,
        envelope: info.envelope,
        messageId: info.messageId
      }
    }
  );
};

module.exports = sendEmail;
