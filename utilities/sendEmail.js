const nodemailer = require("nodemailer");

const sendEmail = async (email, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
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
        servername: process.env.EMAIL_HOST,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: subject,
      text: text,
    });
    console.log("Email sent successfully");
    return { success: true, msg: "Email sent successfully" };
  } catch (error) {
    console.log(error, "Email not sent");
    return { error, msg: "Email not sent" };
  }
};

module.exports = sendEmail;
