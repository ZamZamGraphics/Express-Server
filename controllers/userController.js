const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Settings = require("../models/Settings");
const { serverError, resourceError } = require("../utilities/error");
const { fileExists, deleteFile } = require("../utilities/r2Service");
const sendEmail = require("../utilities/sendEmail");
const ejs = require("ejs");
const path = require("path");

const allUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Date filter
    const dateFilter = {};
    if (req.query.from) {
      dateFilter.$gte = new Date(req.query.from);
    }
    if (req.query.to) {
      const endDate = new Date(req.query.to);
      endDate.setHours(23, 59, 59, 999); // include full day
      dateFilter.$lte = endDate;
    }

    let search = req.query.search || null;
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

    const matchStage = { ...search };
    if (Object.keys(dateFilter).length > 0) {
      matchStage.createdAt = dateFilter;
    }

    const total = await User.count(matchStage);
    const users = await User.find(matchStage)
      .select({
        __v: 0,
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
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
    const hashedPassword = await bcrypt.hash(req.body.password, 11);
    // Generate token by jsonwebtoken and send mail to verify user email
    const token = jwt.sign({ email: req.body.email }, process.env.JWT_SECRET, {
      expiresIn: 60 * 5,
    });

    const userData = {
      ...req.body,
      password: hashedPassword,
      token,
      avatar: null,
    };

    if (req?.file) {
      userData.avatar = req.file.key
    }

    const newUser = new User(userData);
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
    if (req?.file) {
      if (avatar) {
        const oldAvatar = await fileExists(avatar)
        if (oldAvatar) {
          await deleteFile(avatar);
        }
      }
      avatar = req.file.key
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
    const currentUser = req.user.userid;
    const id = req.params.id;

    if (currentUser === id) {
      return resourceError(req, { message: "Delete not allowed!" })
    }

    const user = await User.findById(id);

    // remove uploaded files
    if (user.avatar) {
      await deleteFile(user.avatar)
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
