module.exports = {
  serverError(res, error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  },
  resourceError(res, errors) {
    res.status(400).json({ errors });
  },
};
