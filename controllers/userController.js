const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { serverError, resourceError } = require("../utilities/error");
const path = require("path");
const { unlink } = require("fs");
const { resendVerification } = require("./loginController");

const allUser = async (req, res) => {
  try {
    const limit = req.query.limit || 0;
    const page = req.query.page || 0;
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
      .skip(limit * page) // Page Number * Show Par Page
      .limit(limit) // Show Par Page
      .sort({ createdAt: -1 }); // Last User is First

    res.status(200).json({ users, total });
  } catch (error) {
    serverError(res, error);
  }
};

const userProfile = async (req, res) => {
  try {
    let id = req.user.userid;
    const user = await User.findById(id).select({
      __v: 0,
    });
    res.status(200).json(user);
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
      expiresIn: 60,
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

    await newUser.save();

    // send email to verify account

    res.status(201).json({
      success: true,
      message: "Check user email to activate the account",
    });
  } catch (error) {
    serverError(res, error);
  }
};

const updateUser = async (req, res) => {
  try {
    let id = req.params.id;
    const user = await User.findById(id);

    let { fullname, email, status, role } = req.body;

    let { password } = req.body || "";

    let avatar = user.avatar;
    if (req.files && req.files.length > 0) {
      if (user.avatar && user.avatar !== req.files[0].filename) {
        // remove old avatar
        unlink(
          path.join(__dirname, `/../public/upload/${user.avatar}`),
          (err) => {
            if (err) resourceError(res, err);
          }
        );
        avatar = req.files[0].filename;
      }
    }

    let newPassword;
    const { userid } = req.user;

    if (!password || password.length === 0) {
      newPassword = user.password;
    } else {
      const match = await bcrypt.compare(password, user.password);
      const hash = bcrypt.hashSync(password, 11);
      newPassword = match ? user.password : hash;
      if (userid === id) {
        res.clearCookie("accessToken");
        res.clearCookie("loggedIn");
      }
    }

    let updatedUser = {};
    let newEmail = false;
    if (email !== user.email) {
      const token = jwt.sign({ email }, process.env.JWT_SECRET, {
        expiresIn: 60,
      });
      // send email to Resend Verification code
      newEmail = "Please verify your email address";
      updatedUser = {
        fullname,
        email,
        password: newPassword,
        status: "Unverified",
        avatar,
        role,
        token,
      };

      if (userid === id) {
        res.clearCookie("accessToken");
        res.clearCookie("loggedIn");
      }
    } else {
      updatedUser = {
        fullname,
        password: newPassword,
        status,
        avatar,
        role,
      };
    }

    const updateData = await User.findByIdAndUpdate(
      id,
      { $set: updatedUser },
      { new: true }
    );

    res.status(200).json({
      success: true,
      newEmail,
      message: "User was updated successfully",
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
  userProfile,
  userById,
  register,
  updateUser,
  deleteUser,
};
