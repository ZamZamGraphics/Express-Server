const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Session = require("../models/Session");
const { getClientIp } = require("./client");

const DAY = 24 * 60 * 60 * 1000;
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");

const ipPrefix = (ip = "") =>
  ip.includes(":")
    ? ip.split(":").slice(0, 4).join(":")
    : ip.split(".").slice(0, 3).join(".");

const BIND_COOKIE = "__Host-dbind";

async function issueToken(req, res, user, deviceId) {
  const bind = crypto.randomBytes(32).toString("hex");

  const session = await Session.create({
    userid: user._id,
    deviceId,
    bindHash: sha(bind),
    uaHash: uaFingerprint(req),
    ipPrefix: ipPrefix(getClientIp(req)),
    expiresAt: new Date(Date.now() + DAY),
  });

  res.cookie(BIND_COOKIE, bind, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: DAY,
  });

  return jwt.sign(
    { userid: user._id, sid: session._id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );
}

const preAuthToken = (user, deviceId) =>
  jwt.sign(
    { userid: user._id, did: deviceId, purpose: "2fa" },
    process.env.JWT_SECRET,
    { expiresIn: "5m" },
  );

const uaFingerprint = (req) => {
  const ua = req.useragent || {};
  return sha([ua.browser, ua.os, ua.platform].join("|"));
};

module.exports = {
  issueToken,
  preAuthToken,
  sha,
  ipPrefix,
  uaFingerprint,
  BIND_COOKIE,
};
