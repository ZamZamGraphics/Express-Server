const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const settingsSchema = new Schema({
  perPage: {
    type: Number,
    required: true,
  },
  emailChecked: {
    type: Boolean,
    default: false,
  },
  smsChecked: {
    type: Boolean,
    default: false,
  },
  authentication: {
    type: Boolean,
    default: false,
  },
  darkMode: {
    type: Boolean,
    default: true,
  },
  user: { type: Schema.Types.ObjectId, ref: "User" }
});

const Settings = mongoose.model("Settings", settingsSchema);

module.exports = Settings;
