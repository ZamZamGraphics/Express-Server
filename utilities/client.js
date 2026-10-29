const crypto = require("crypto");
const ipaddr = require("ipaddr.js");

const FALLBACK_V4 = [
  "173.245.48.0/20",
  "103.21.244.0/22",
  "103.22.200.0/22",
  "103.31.4.0/22",
  "141.101.64.0/18",
  "108.162.192.0/18",
  "190.93.240.0/20",
  "188.114.96.0/20",
  "197.234.240.0/22",
  "198.41.128.0/17",
  "162.158.0.0/15",
  "104.16.0.0/13",
  "104.24.0.0/14",
  "172.64.0.0/13",
  "131.0.72.0/22",
];
const FALLBACK_V6 = [
  "2400:cb00::/32",
  "2606:4700::/32",
  "2803:f800::/32",
  "2405:b500::/32",
  "2405:8100::/32",
  "2a06:98c0::/29",
  "2c0f:f248::/32",
];

let ranges = [];
const load = (list) => (ranges = list.map((c) => ipaddr.parseCIDR(c)));
load([...FALLBACK_V4, ...FALLBACK_V6]);

async function refreshCloudflareRanges() {
  try {
    const [v4, v6] = await Promise.all(
      [
        "https://www.cloudflare.com/ips-v4",
        "https://www.cloudflare.com/ips-v6",
      ].map(async (u) => {
        const r = await fetch(u);
        if (!r.ok) throw new Error(u);
        return (await r.text())
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
      }),
    );
    if (v4.length && v6.length) load([...v4, ...v6]);
  } catch (e) {
    console.warn(
      "Cloudflare range refresh failed, keeping current list:",
      e.message,
    );
  }
}
refreshCloudflareRanges();
setInterval(refreshCloudflareRanges, 24 * 60 * 60 * 1000).unref();

const normalize = (ip = "") => {
  ip = String(ip).trim();
  return ip.startsWith("::ffff:") ? ip.slice(7) : ip;
};

const isCloudflare = (ip) => {
  try {
    const addr = ipaddr.process(ip);
    return ranges.some(
      ([net, bits]) => addr.kind() === net.kind() && addr.match(net, bits),
    );
  } catch {
    return false;
  }
};

const safeEq = (a = "", b = "") => {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

const fromNext = (req) =>
  !!process.env.INTERNAL_SECRET &&
  safeEq(req.headers["x-internal-secret"] || "", process.env.INTERNAL_SECRET);

const lastXff = (req) => {
  const parts = String(req.headers["x-forwarded-for"] || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return normalize(parts[parts.length - 1] || "");
};

const getClientIp = (req) => {
  // 1) আমাদের Next সার্ভার, সিক্রেট মিললে
  if (fromNext(req)) return normalize(req.headers["x-real-client-ip"]);

  // 2) Cloudflare থেকে এসেছে কি না, Traefik-এর দেখা পিয়ার দিয়ে যাচাই
  const peer = lastXff(req);
  if (peer && isCloudflare(peer)) {
    const cf = normalize(req.headers["cf-connecting-ip"]);
    if (cf) return cf;
  }

  // 3) সরাসরি/অজানা পথ: হেডার বিশ্বাস নয়
  return peer || normalize(req.socket.remoteAddress);
};

const getUserAgent = (req) =>
  fromNext(req)
    ? req.headers["x-real-client-ua"] || ""
    : req.headers["user-agent"] || "";

module.exports = {
  getClientIp,
  getUserAgent,
  fromNext,
  isCloudflare,
};
