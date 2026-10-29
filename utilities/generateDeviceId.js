const crypto = require("crypto");

const generateDeviceId = (req) => {
    const ua = req.useragent || {};

    const data = [
        ua.browser,
        ua.os,
        ua.platform,
        ua.source,
        req.headers["accept-language"] || ""
    ].join("|");

    return crypto.createHash("sha256").update(data).digest("hex");
}

module.exports = generateDeviceId;