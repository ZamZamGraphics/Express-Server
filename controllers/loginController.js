const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { serverError, resourceError } = require("../utilities/error");

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
      res.status(200).json({
        success: true,
        msg: "Verification successful",
      });
    } else {
      resourceError(res, { msg: "User not exist or email is incorrect!" });
    }
  } catch (err) {
    return resourceError(res, {
      msg: "The Verification Token Has Expired or is invalid!",
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
        expiresIn: 60,
      });
      await User.updateOne({ email }, { $set: { token } });
      res.status(200).json({
        msg: "Resend Verification code",
        token,
      });
    } else {
      resourceError(res, { msg: "User not exist or email is incorrect!" });
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

      res.status(200).json({
        msg: "Check your email to reset password",
        userId: user._id,
        token,
      });
    } else {
      resourceError(res, { msg: "User not exist or email is incorrect!" });
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
        msg: "The Reset Token Has Expired or is invalid!",
      });

    const validateToken = await User.findOne({ _id: id, token });
    if (!validateToken)
      return resourceError(res, {
        msg: "The Reset Token Has Expired or is invalid!",
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

        res.status(200).json({
          success: true,
          msg: "Password has been successfully changed",
        });
      } catch (error) {
        serverError(res, error);
      }
    });
  } catch (err) {
    return resourceError(res, {
      msg: "The Reset Token Has Expired or is invalid!",
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
      const isValidPassword = await bcrypt.compare(
        req.body.password,
        user.password
      );

      if (isValidPassword) {
        // prepare the user object to generate token
        const userObject = {
          userid: user._id,
          fullname: user.fullname,
          username: user.username,
          email: user.email,
          avatar: user.avatar || null,
          status: user.status,
          role: user.role,
        };

        // generate token
        const token = jwt.sign(userObject, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRY,
        });

        res.status(200).json({
          success: true,
          token: `Bearer ${token}`,
        });
      } else {
        const errors = {
          msg: "The username or password is incorrect! Please try again.",
        };
        return resourceError(res, errors);
      }
    } else {
      const errors = {
        msg: "The username or password is incorrect! Please try again.",
      };
      return resourceError(res, errors);
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
