const Settings = require("../models/Settings");
const { serverError, resourceError } = require("../utilities/error");
const jwt = require("jsonwebtoken");
const ejs = require("ejs");
const path = require("path");
const sendEmail = require("../utilities/sendEmail");

const getSettings = async (req, res) => {
  try {
    const result = await Settings.find();
    res.status(200).json(result);
  } catch (err) {
    serverError(res, err);
  }
};

const updateSettings = async (req, res) => {
  try {
    let { id } = req.params;
    const settings = await Settings.findById(id);
    const { siteTitle, tagline, email, perPage, emailChecked, smsChecked } =
      req.body;

    let newEmail = false;
    let token = false;
    if (settings.email !== email) {
      token = jwt.sign({ email, id }, process.env.JWT_SECRET, {
        expiresIn: 60 * 5,
      });
      // send email to Verify
      const generateURL = `${process.env.APP_URL}/adminemailverify?token=${token}`;
      const data = await ejs.renderFile(
        path.join(__dirname, `/../views/adminVerification.ejs`),
        {
          sitename: siteTitle,
          url: generateURL,
        }
      );

      sendEmail({
        to: email,
        subject: "Verify Email Address",
        html: data,
        attachments: [
          {
            filename: "logo.png",
            path: path.join(__dirname, `/../public/assets/logo.png`),
            cid: "headerLogo",
          },
        ],
      });
      newEmail = "Please verify your email address";
    }

    const data = {
      siteTitle,
      tagline,
      token,
      perPage,
      emailChecked,
      smsChecked,
    };

    const updatedData = await Settings.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    );

    res.status(200).json({
      message: "Settings was updated successfully",
      newEmail,
      updatedData,
    });
  } catch (err) {
    serverError(res, err);
  }
};

const updatedEmail = async (req, res) => {
  try {
    const token = req.query.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { email, id } = decoded;

    const result = await Settings.findByIdAndUpdate(
      id,
      { $set: { email, token: null } },
      { new: true }
    );

    res.status(200).json({
      message: "Email was updated successfully",
      success: true,
      result,
    });
  } catch (err) {
    return resourceError(res, {
      message: "The Verification Token Has Expired or is invalid!",
      err,
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  updatedEmail,
};
