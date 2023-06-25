const bcrypt = require("bcrypt");
const User = require("../models/User");
const { serverError, resourceError } = require("../utilities/error");

const allUser = (req, res) => {
  User.find()
    .then((users) => {
      res.status(200).json(users);
    })
    .catch((error) => serverError(res, error));
};
const singleUser = (req, res) => {
  let id = req.params.id;

  User.findById(id)
    .then((users) => {
      res.status(200).json(users);
    })
    .catch((error) => serverError(res, error));
};
const register = async (req, res) => {
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
    await user.save((err) => {
      if()
      
    }); 
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
  singleUser,
  register,
  loginUser,
};
