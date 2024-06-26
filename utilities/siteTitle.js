const Settings = require("../models/Settings");

const siteTitle = async (req, res) => {
    try {
      const result = await Settings.findOne();
      return result.siteTitle;
    } catch (err) {
      return null;
    }
};

module.exports = siteTitle;