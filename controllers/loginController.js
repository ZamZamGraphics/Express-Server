const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { serverError, resourceError } = require("../utilities/error");

// do login
async function login(req, res, next) {
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
}

// do logout
function logout(req, res) {
  res.clearCookie(process.env.COOKIE_NAME);
  res.send("logged out");
}

module.exports = {
  login,
  logout,
};
