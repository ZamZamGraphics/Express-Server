const express = require("express");
const mongoose = require("mongoose");
const createError = require("http-errors");
const cookieParser = require("cookie-parser");
const useragent = require("express-useragent");
const dotenv = require("dotenv");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const path = require("path");
const { getClientIp, getUserAgent } = require("./utilities/client");
const { apiLimiter } = require("./middleware/rateLimit");
const requireAuth = require("./middleware/requireAuth");

const app = express();
dotenv.config();

const PORT = process.env.PORT || 5000;
const COOKIE_SECRET = process.env.COOKIE_SECRET || null;
const DB_URL = process.env.MONGODB_URL || null;

app.set("trust proxy", 1);
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);
app.disable("x-powered-by");
app.use(morgan("dev"));
const whitelist = [
  process.env.ROOT_URL,
  process.env.WWW_URL,
  process.env.APP_URL,
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow curl / server-side
    if (whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // 🔑 REQUIRED
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // 🔑 preflight fix

// parse cookies
app.use(cookieParser(COOKIE_SECRET));
app.use((req, res, next) => {
  req.headers["user-agent"] = getUserAgent(req);
  req.clientIp = getClientIp(req);
  next();
});
app.use(useragent.express());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// set static folder
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/", apiLimiter);

// Public Route
app.use("/v2/api", apiLimiter, require("./routers/apiRoute"));
app.use("/v2/auth", require("./routers/authRoute"));

// Private Route
app.use("/v2/students", requireAuth, require("./routers/studentRoute"));
app.use("/v2/admission", requireAuth, require("./routers/admissionRoute"));
app.use("/v2/courses", requireAuth, require("./routers/courseRoute"));
app.use("/v2/batches", requireAuth, require("./routers/batchRoute"));
app.use("/v2/employee", requireAuth, require("./routers/employeeRoute"));
app.use("/v2/expenses", requireAuth, require("./routers/expenseRoute"));
app.use("/v2/messages", requireAuth, require("./routers/messagesRoute"));
app.use("/v2/users", requireAuth, require("./routers/userRoute"));
app.use("/v2/settings", requireAuth, require("./routers/settingsRoute"));

// API Home Route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome To Our Application",
  });
});

// debug-ip address
app.get("/debug-ip", (req, res) => {
  res.json({
    clientIp: req.clientIp,
    peer: String(req.headers["x-forwarded-for"] || ""),
    viaCloudflare: require("./utilities/client").isCloudflare(
      String(req.headers["x-forwarded-for"] || "")
        .split(",")
        .pop()
        .trim(),
    ),
  });
});

// setting view engine to ejs
app.set("view engine", "ejs");

// 404 not found handler
app.use((req, res, next) => {
  next(createError(404, "Your requested content was not found!"));
});

// Global error handler
app.use((err, req, res, next) => {
  // Multer errors (file size, file type, etc.)
  if (err.name === "MulterError") {
    const messages = {
      LIMIT_FILE_SIZE: "File too large. Max size is 2 MB.",
      LIMIT_FILE_COUNT: "Too many files. Max is 1 files per request.",
      LIMIT_UNEXPECTED_FILE: `Unexpected field: ${err.field}`,
    };
    return res.status(400).json({
      success: false,
      message: messages[err.code] || err.message,
    });
  }

  // File type rejection from fileFilter
  if (err.message?.startsWith("File type not allowed")) {
    return res.status(400).json({ success: false, message: err.message });
  }

  console.error("[server error]", err); // server side log
  return res.status(err.status || err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  console.log(`SERVER is RUNNING http://localhost:${PORT}`);
  mongoose
    .connect(DB_URL)
    .then(() => console.log("Database connection successful!"))
    .catch((err) => console.error(err));
});
