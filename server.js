const express = require("express");
const useragent = require('express-useragent');
const dotenv = require("dotenv");
const morgan = require("morgan");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const cors = require("cors");
const path = require("path");
const createError = require("http-errors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const authenticate = require("./middleware/authenticate");

const app = express();
dotenv.config();

const PORT = process.env.PORT || 5000;
const COOKIE_SECRET = process.env.COOKIE_SECRET || null;
const DB_URL = process.env.MONGODB_URL || null;

// Login Route Limiter (Brute Force Attack Protection)
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // ৫ মিনিট
  limit: 5, // সর্বোচ্চ ৫ বার চেষ্টা করা যাবে
  standardHeaders: true, // `RateLimit-*` হেডার পাঠাবে
  legacyHeaders: false,
  handler: function (req, res) {
    return res.status(429).json({
      errors: { message: "Too many login attempts. Please try again in 5 minutes." }
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
      errors: { message: "Too many requests. Please try again later." }
    });
  },
});
app.set('trust proxy', true);
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.disable("x-powered-by");
app.use(morgan("dev"));
const whitelist = [
  process.env.ROOT_URL,
  process.env.WWW_URL,
  process.env.APP_URL,
];
const corsOptions = {
  origin: whitelist
}

app.use(cors(corsOptions));
app.use(useragent.express());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// set static folder
app.use(express.static(path.join(__dirname, "public")));
// parse cookies
app.use(cookieParser(COOKIE_SECRET));

app.use("/api/", apiLimiter);

// Public Route
app.use("/v2/api", apiLimiter, require("./routers/apiRoute"));
app.use("/v2/auth", loginLimiter, require("./routers/authRoute"));

// Private Route
app.use("/v2/students", authenticate, require("./routers/studentRoute"));
app.use("/v2/admission", authenticate, require("./routers/admissionRoute"));
app.use("/v2/courses", authenticate, require("./routers/courseRoute"));
app.use("/v2/batches", authenticate, require("./routers/batchRoute"));
app.use("/v2/employee", authenticate, require("./routers/employeeRoute"));
app.use("/v2/expenses", authenticate, require("./routers/expenseRoute"));
app.use("/v2/messages", authenticate, require("./routers/messagesRoute"));
app.use("/v2/users", authenticate, require("./routers/userRoute"));
app.use("/v2/settings", authenticate, require("./routers/settingsRoute"));

// API Home Route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome To Our Application",
  });
});

// setting view engine to ejs
app.set("view engine", "ejs");

// 404 not found handler
app.use((req, res, next) => {
  next(createError(404, "Your requested content was not found!"));
});

// common error handler
app.use((err, req, res, next) => {
  console.error(err); // server side log
  res.status(err.status || 500);
  res.json({
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`SERVER is RUNNING http://localhost:${PORT}`);
  mongoose
    .connect(DB_URL)
    .then(() => console.log("Database connection successful!"))
    .catch((err) => console.log(err));
});
