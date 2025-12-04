const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const trustedDeviceSchema = new Schema({
    userid: { type: Schema.Types.ObjectId, ref: "User" },
    deviceId: String,
    device: String,
    os: String,
    browser: String,
    ip: String,
    addedAt: {
        type: Date,
        default: Date.now,
        expires: "30d"
    }
});

const TrustedDevice = mongoose.model("TrustedDevice", trustedDeviceSchema);

module.exports = TrustedDevice;
