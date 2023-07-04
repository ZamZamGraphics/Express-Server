const jwt = require("jsonwebtoken");
const { resourceError } = require("../utilities/error");

const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decode;
    next();
  } catch (error) {
    return resourceError(res, {
      msg: "Authentication Failed",
      error,
    });
  }
};

module.exports = authenticate;
