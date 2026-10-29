const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const sessionSchema = new Schema(
  {
    userid: { type: Schema.Types.ObjectId, ref: "User", index: true },
    deviceId: { type: String, index: true },
    bindHash: String,
    uaHash: String,
    ipPrefix: String,
    revoked: { type: Boolean, default: false },
    expiresAt: { type: Date, index: { expires: 0 } },
  },
  { timestamps: true },
);

const Session = mongoose.model("Session", sessionSchema);
module.exports = Session;
