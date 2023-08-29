const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { serverError, resourceError } = require("../utilities/error");
const path = require("path");
const { unlink } = require("fs");

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
    const users = await User.find(search)
      .select({
        __v: 0,
      })
      // users?page=1&limit=10&search=value
      .skip(limit * page) // Page Number * Show Par Page
      .limit(limit) // Show Par Page
      .sort({ createdAt: -1 }); // Last User is First
    res.status(200).json(users);
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
      });
    }

    const result = await newUser.save();
    res.status(201).json({
      message: "User Created Successfully",
      result,
    });
  } catch (error) {
    serverError(res, error);
  }
};

const updateUser = async (req, res) => {
  try {
    let id = req.params.id;
    const user = await User.findById(id);

    let { fullname, email, password, status, role } = req.body;

    let avatar = null;
    if (req.files && req.files.length > 0) {
      avatar = req.files[0].filename;
    }

    /*
    // check new avatar and remove old avatar 
    if (user.avatar) {
      unlink(
        path.join(__dirname, `/../public/upload/${user.avatar}`),
        (err) => {
          if (err) resourceError(res, err);
        }
      );
    }
    */

    let newPassword;

    if (!password || password.length === 0) {
      newPassword = user.password;
    } else {
      const match = await bcrypt.compare(password, user.password);
      const hash = bcrypt.hashSync(password, 11);
      newPassword = match ? user.password : hash;
    }

    let updatedUser = {
      fullname,
      email,
      password: newPassword,
      status,
      avatar,
      role,
    };

    const updateData = await User.findByIdAndUpdate(
      id,
      { $set: updatedUser },
      { new: true }
    );

    res.status(200).json({
      message: "User was updated successfully",
      updateData,
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
