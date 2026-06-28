module.exports = {
  serverError(res, error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error,
    });
  },
  resourceError(res, errors) {
    res.status(400).json({ errors });
  },
};
