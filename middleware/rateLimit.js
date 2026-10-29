const { rateLimit } = require("express-rate-limit");

// Login Route Limiter (Brute Force Attack Protection)
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 মিনিট
  max: 10, // সর্বোচ্চ 10 বার চেষ্টা করা যাবে
  standardHeaders: true, // `RateLimit-*` হেডার পাঠাবে
  keyGenerator: (req) => req.clientIp,
  validate: { trustProxy: false, xForwardedForHeader: false },
  legacyHeaders: false,
  handler: function (req, res) {
    return res.status(429).json({
      success: false,
      message: "Too many login attempts. Please try again in 10 minutes.",
    });
  },
});

// General API Limiter (Public API usage)
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 মিনিট
  limit: 100, // সর্বোচ্চ 100 বার চেষ্টা করা যাবে
  standardHeaders: true, // `RateLimit-*` হেডার পাঠাবে
  legacyHeaders: false,
  handler: function (req, res) {
    return res.status(429).json({
      success: false,
      message: "Too many requests. Please try again later.",
    });
  },
});

module.exports = { authLimiter, apiLimiter };
