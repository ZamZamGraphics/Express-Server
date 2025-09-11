const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Settings = require("../models/Settings");
const { serverError, resourceError } = require("../utilities/error");
const sendEmail = require("../utilities/sendEmail");
const ejs = require("ejs");
const path = require("path");
const { unlink } = require("fs");

const allUser = async (req, res) => {
  try {
    const page = req.query.page || 0;
    const limit = req.query.limit || 0;
    const skip = (page - 1) * limit;
    let search = req.query.search || null;
    // searchQuery field "fullname", "username", "email", "role", "status"
    const searchQuery = {
      $or: [
        { fullname: { $regex: search, $options: "i" } },
        { username: search },
        { email: search },
        { role: search },
        { status: search },
      ],
    };
    search = search ? searchQuery : {};
    const total = await User.count(search);
    const users = await User.find(search)
      .select({
        __v: 0,
      })
      // users?page=1&limit=10&search=value
      .skip(skip) // Page Number * Show Par Page
      .limit(limit) // Show Par Page
      .sort({ createdAt: -1 }); // Last  is First
    res.status(200).json({ users, total });
  } catch (error) {
    serverError(res, error);
  }
};

const userById = async (req, res) => {
  try {
    let id = req.params.id;
    const user = await User.findById(id).select({
      __v: 0,
    });
    res.status(200).json(user);
  } catch (error) {
    serverError(res, error);
  }
};

const register = async (req, res) => {
  try {
    let newUser;
    const hashedPassword = await bcrypt.hash(req.body.password, 11);
    // Generate token by jsonwebtoken and send mail to verify user email
    const token = jwt.sign({ email: req.body.email }, process.env.JWT_SECRET, {
      expiresIn: 60 * 5,
    });

    if (req.files && req.files.length > 0) {
      newUser = new User({
        ...req.body,
        password: hashedPassword,
        token,
        avatar: req.files[0].filename,
      });
    } else {
      newUser = new User({
        ...req.body,
        password: hashedPassword,
        token,
        avatar: null,
      });
    }

    const user = await newUser.save();

    const settings = new Settings({
      perPage: 20,
      emailChecked: false,
      smsChecked: false,
      darkMode: true,
      token: null,
      user: user._id
    });

    await settings.save();

    // send email to verify account
    const generateURL = `${process.env.APP_URL}/verify?token=${token}`;
    const data = await ejs.renderFile(
      path.join(__dirname, `/../views/resendVerification.ejs`),
      {
        sitename: "AL MADINA IT",
        fullname: user.fullname,
        url: generateURL,
      }
    );

    sendEmail({
      to: user.email,
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

    res.status(201).json({
      success: true,
      message: "Check user email to activate the account",
      user,
    });
  } catch (error) {
    serverError(res, error);
  }
};

const updateUser = async (req, res) => {
  try {
    let id = req.params.id;
    const user = await User.findById(id);

    const allowedFields = ["fullname", "email", "password", "status", "role"];

    let updateFields = {};
    for (let field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    }

    let email = req.body?.email;
    let password = req.body?.password || null;

    let avatar = user.avatar;
    if (req.files && req.files.length > 0) {
      if (avatar !== null && avatar !== req.files[0].filename) {
        // remove old avatar
        unlink(
          path.join(__dirname, `/../public/upload/${user.avatar}`),
          (err) => {
            if (err) resourceError(res, err);
          }
        );
      }
      avatar = req.files[0].filename;
    }

    updateFields.avatar = avatar;
    const { userid } = req.user;

    if (password) {
      const match = await bcrypt.compare(password, user.password);
      const hash = bcrypt.hashSync(password, 11);
      updateFields.password = match ? user.password : hash;

      if (userid === id) {
        res.clearCookie("accessToken");
        res.clearCookie("loggedIn");
      }
    }

    let newEmail = false;
    if (email !== user.email) {
      const token = jwt.sign({ email }, process.env.JWT_SECRET, {
        expiresIn: 60 * 5,
      });
      // send email to Resend Verification code
      const generateURL = `${process.env.APP_URL}/verify?token=${token}`;
      const data = await ejs.renderFile(
        path.join(__dirname, `/../views/resendVerification.ejs`),
        {
          sitename: "AL MADINA IT",
          fullname: user.fullname,
          url: generateURL,
        }
      );

      sendEmail({
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

      newEmail = "Please verify your email address";
      updateFields.status = "Unverified";

      if (userid === id) {
        res.clearCookie("accessToken");
        res.clearCookie("loggedIn");
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );

    res.status(200).json({
      success: true,
      newEmail,
      message: "User was updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    serverError(res, error);
  }
};

const deleteUser = async (req, res) => {
  try {
    let id = req.params.id;
    const user = await User.findById(id);

    // remove uploaded files
    if (user.avatar) {
      unlink(
        path.join(__dirname, `/../public/upload/${user.avatar}`),
        (err) => {
          if (err) resourceError(res, err);
        }
      );
    }

    await User.findByIdAndDelete(id);
    res.status(200).json({ message: "User was deleted!" });
  } catch (error) {
    serverError(res, error);
  }
};

module.exports = {
  allUser,
  userById,
  register,
  updateUser,
  deleteUser,
};
