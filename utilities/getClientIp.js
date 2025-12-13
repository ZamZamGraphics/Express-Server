const getClientIp = (req) => {
  // req.ip already respects X-Forwarded-For when trust proxy is true
  let ip = req.ip || req.socket.remoteAddress || "";

  // Clean IPv4 from IPv6-mapped (::ffff:)
  if (ip.includes("::ffff:")) {
    ip = ip.split("::ffff:")[1];
  }

  return ip;
};

module.exports = getClientIp;
