const jwt = require("jsonwebtoken");
const Session = require("../models/Session");
const { sha, ipPrefix, uaFingerprint, BIND_COOKIE } = require("../utilities/token");

module.exports = async function requireAuth(req, res, next) {
  try {
    const raw = (req.headers.authorization || "").replace(/^Bearer /, "");
    if (!raw) return res.status(401).json({ message: "Unauthorized" });

    const p = jwt.verify(raw, process.env.JWT_SECRET);
    if (p.purpose) return res.status(401).json({ message: "Unauthorized" });

    const s = await Session.findById(p.sid);
    if (!s || s.revoked) return res.status(401).json({ message: "Session invalid" });

    const bind = req.cookies?.[BIND_COOKIE];
    const bindOk = !!bind && sha(bind) === s.bindHash;
    const uaOk = s.uaHash === uaFingerprint(req);

    if (!bindOk || !uaOk) {
      s.revoked = true;
      await s.save();
      console.warn("Session hijack suspected", { userid: p.userid, sid: p.sid, bindOk, uaOk });
      return res.status(401).json({ message: "Session invalid" });
    }

    if (s.ipPrefix !== ipPrefix(req.clientIp)) {
      console.warn("IP prefix changed", { userid: p.userid, sid: p.sid });
    }

    req.user = { userid: p.userid, sid: p.sid };
    next();
  } catch {
    res.status(401).json({ message: "Unauthorized" });
  }
};