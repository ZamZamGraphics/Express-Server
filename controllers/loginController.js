const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { serverError, resourceError } = require("../utilities/error");
const sendEmail = require("../utilities/sendEmail");
const ejs = require("ejs");
const path = require("path");

// verify token
const verification = async (req, res, next) => {
  try {
    const token = req.query.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    const user = await User.findOne({ email });
    if (user) {
      await User.updateOne(
        { email },
        {
          $set: {
            status: "Verified",
            token: null,
          },
        }
      );

      // send email to Verification successful
      const data = await ejs.renderFile(
        __dirname + "../../views/accountVerified.ejs",
        {
          sitename: process.env.SITE_NAME,
          fullname: user.fullname,
        }
      );

      await sendEmail({
        to: user.email,
        subject: "Account Verified",
        html: data,
        attachments: [
          {
            filename: "logo.png",
            path: path.join(__dirname, `/../public/assets/logo.png`),
            cid: "headerLogo",
          },
        ],
      });

      res.status(200).json({
        success: true,
        message: "Verification successful",
      });
    } else {
      resourceError(res, { message: "User not exist or email is incorrect!" });
    }
  } catch (err) {
    return resourceError(res, {
      message: "The Verification Token Has Expired or is invalid!",
      err,
    });
  }
};

// resend verification code to email
const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      const token = jwt.sign({ email }, process.env.JWT_SECRET, {
        expiresIn: 60 * 5,
      });
      await User.updateOne({ email }, { $set: { token } });

      // send email to Resend Verification code
      const generateURL = `${process.env.APP_URL}/verify?token=${token}`;

      const data = await ejs.renderFile(
        __dirname + "../../views/resendVerification.ejs",
        {
          sitename: process.env.SITE_NAME,
          fullname: user.fullname,
          url: generateURL,
        }
      );

      await sendEmail({
        to: email,
        subject: "Verify Your Email Address to activate the account",
        html: data,
        attachments: [
          {
            filename: "logo.png",
            path: path.join(__dirname, `/../public/assets/logo.png`),
            cid: "headerLogo",
          },
        ],
      });

      res.status(200).json({
        success: true,
        message: "Resend Verification token",
      });
    } else {
      resourceError(res, { message: "User not exist or email is incorrect!" });
    }
  } catch (error) {
    serverError(res, error);
  }
};

// forgot password
const forgotPassowrd = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      await User.updateOne({ email }, { $set: { token } });

      // send reset link with token to user email
      const generateURL = `${process.env.APP_URL}/reset?token=${token}&id=${user._id}`;

      const data = await ejs.renderFile(
        __dirname + "../../views/resetPassword.ejs",
        {
          sitename: process.env.SITE_NAME,
          fullname: user.fullname,
          url: generateURL,
        }
      );

      await sendEmail({
        to: email,
        subject: "Reset your Password",
        html: data,
        attachments: [
          {
            filename: "logo.png",
            path: path.join(__dirname, `/../public/assets/logo.png`),
            cid: "headerLogo",
          },
        ],
      });
      res.status(200).json({
        success: true,
        message: "Check your email to reset password",
      });
    } else {
      resourceError(res, { message: "User not exist or email is incorrect!" });
    }
  } catch (error) {
    serverError(res, error);
  }
};

// reset password
const resetPassword = async (req, res, next) => {
  try {
    const { id, token } = req.query;
    const user = await User.findById(id);
    if (!user)
      return resourceError(res, {
        message: "The Reset Token Has Expired or is invalid!",
      });

    const validateToken = await User.findOne({ _id: id, token });
    if (!validateToken)
      return resourceError(res, {
        message: "The Reset Token Has Expired or is invalid!",
      });

    bcrypt.hash(req.body.password, 11, async (err, hash) => {
      if (err) {
        return resourceError(res, "Server Error Occurred");
      }

      try {
        await User.findByIdAndUpdate(
          { _id: id },
          { $set: { password: hash, token: null } }
        );

        // send email to user.email
        const data = await ejs.renderFile(
          __dirname + "../../views/passwordChanged.ejs",
          {
            sitename: process.env.SITE_NAME,
            fullname: user.fullname,
          }
        );

        await sendEmail({
          to: user.email,
          subject: "Password changed successfully",
          html: data,
          attachments: [
            {
              filename: "logo.png",
              path: path.join(__dirname, `/../public/assets/logo.png`),
              cid: "headerLogo",
            },
          ],
        });

        res.status(200).json({
          success: true,
          message: "Password has been successfully changed",
        });
      } catch (error) {
        serverError(res, error);
      }
    });
  } catch (err) {
    return resourceError(res, {
      message: "The Reset Token Has Expired or is invalid!",
      err,
    });
  }
};

// do login
const login = async (req, res, next) => {
  try {
    // find a user who has this email/username
    const user = await User.findOne({
      $or: [{ email: req.body.username }, { username: req.body.username }],
    });

    if (user && user._id) {
      if (user.status !== "Verified")
        return resourceError(res, {
          message: "User not Verified",
        });
      const isValidPassword = await bcrypt.compare(
        req.body.password,
        user.password
      );

      if (isValidPassword) {
        // prepare the user object to generate token
        const userObject = {
          userid: user._id,
          status: user.status,
          role: user.role,
        };

        // generate token
        const token = jwt.sign(userObject, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRY,
        });

        // set cookie
        res.cookie("accessToken", token, {
          maxAge: process.env.JWT_EXPIRY,
          httpOnly: false,
        });

        res.cookie("loggedIn", true, {
          maxAge: process.env.JWT_EXPIRY,
          httpOnly: false,
        });

        res.status(200).json({
          success: true,
          token: `Bearer ${token}`,
        });
      } else {
        return resourceError(res, {
          message: "The password is incorrect!",
        });
      }
    } else {
      return resourceError(res, {
        message: "The username is incorrect!",
      });
    }
  } catch (err) {
    return serverError(res, err);
  }
};

module.exports = {
  verification,
  resendVerification,
  forgotPassowrd,
  resetPassword,
  login,
};
