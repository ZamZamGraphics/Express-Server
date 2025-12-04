const crypto = require("crypto");

const generateDeviceId = (req) => {
    const ip = req.ip;
    const { os, browser } = req.useragent;
    const baseString = `${ip}-${browser}-${os}`;

    return crypto.createHash("sha256").update(baseString).digest("hex");
}

module.exports = generateDeviceId;