const Settings = require("../models/Settings");
const { serverError } = require("../utilities/error");

const getSettings = async (req, res) => {
  try {
    const result = await Settings.findOne({ user: req.user.userid });
    res.status(200).json(result);
  } catch (err) {
    serverError(res, err);
  }
};

const updateSettings = async (req, res) => {
  try {
    let { id } = req.params;
    const updatedData = await Settings.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Settings was updated successfully",
      result: updatedData,
    });
  } catch (err) {
    serverError(res, err);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
