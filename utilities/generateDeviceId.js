const crypto = require("crypto");
const getClientIp = require("./getClientIp");

const generateDeviceId = (req) => {
    const ua = req.useragent;
    const clientIp = getClientIp(req);

    const data = [
        ua.browser,
        ua.version,
        ua.os,
        ua.platform,
        ua.source,
        req.headers["accept-language"] || "",
        clientIp || ""
    ].join("|");

    return crypto.createHash("sha256").update(data).digest("hex");
}

module.exports = generateDeviceId;