const bcrypt = require("bcrypt");
const User = require("../models/User");
const { serverError, resourceError } = require("../utilities/error");

const allUser = (req, res) => {
  let limit = req.query.limit || 0;
  let page = req.query.page || 0;

  // "fullname", "username", "email", "role", "status"

  User.find()
    .select({
      __v: 0,
    })
    // users?page=1&limit=10
    .skip(limit * page) // Page Number * Show Par Page
    .limit(limit) // Show Par Page
    .sort({ createdAt: -1 }) // Last User is First
    .then((users) => {
      res.status(200).json(users);
    })
    .catch((error) => serverError(res, error));
};

const userById = (req, res) => {
  let id = req.params.id;

  User.findById(id)
    .select({
      __v: 0,
    })
    .then((users) => {
      res.status(200).json(users);
    })
    .catch((error) => serverError(res, error));
};

const register = (req, res) => {
  let { fullname, username, email, password, status, avatar, role } = req.body;

  bcrypt.hash(password, 11, (err, hash) => {
    if (err) {
      return resourceError(res, "Server Error Occurred");
    }

    let user = new User({
      fullname,
      username,
      email,
      password: hash,
      status,
      avatar,
      role,
    });
    user
      .save()
      .then((user) => {
        res.status(201).json({
          message: "User Created Successfully",
          user,
        });
      })
      .catch((error) => serverError(res, error));
  });
};

const loginUser = (req, res) => {
  let { username, password } = req.body;

  res.status(200).json(req.body);
};

module.exports = {
  allUser,
  userById,
  register,
  loginUser,
};
