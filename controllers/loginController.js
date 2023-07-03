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
        expiresIn: 60,
      });
      await User.updateOne({ email }, { $set: { token } });
      res.status(200).json({
        message: "Resend Verification code",
        token,
      });
    } else {
      resourceError(res, { message: "User not exist or email is incorrect!" });
    }
  } catch (error) {
    serverError(res, error);
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
          username: user.username,
          email: user.email,
          avatar: user.avatar || null,
          role: user.role || "user",
        };

        // generate token
        const token = jwt.sign(userObject, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRY,
        });

        // set cookie
        res.cookie(process.env.COOKIE_NAME, token, {
          maxAge: process.env.JWT_EXPIRY,
          httpOnly: true,
          signed: true,
        });

        // set logged in user local identifier
        res.locals.loggedInUser = userObject;

        res.status(200).json({
          success: true,
          token: token,
        });
      } else {
        const errors = {
          common: {
            msg: "The username or password is incorrect! Please try again.",
          },
        };
        return resourceError(res, errors);
      }
    } else {
      const errors = {
        common: {
          msg: "The username or password is incorrect! Please try again.",
        },
      };
      return resourceError(res, errors);
    }
  } catch (err) {
    return serverError(res, err);
  }
};

// do logout
const logout = (req, res) => {
  res.clearCookie(process.env.COOKIE_NAME);
  res.send("logged out");
};

module.exports = {
  verification,
  resendVerification,
  login,
  logout,
};
