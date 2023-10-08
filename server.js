const express = require("express");
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

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 50, // Limit each IP to 5 request per windowMs
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: function (req, res) {
    return res.status(429).json({
      message: "You sent too many requests. Please wait a while then try again",
    });
  },
});

app.use(helmet());
app.disable("x-powered-by");
app.use(limiter);
app.use(morgan("dev"));
app.use(
  cors({
    credentials: true,
    origin: process.env.APP_URL || "*",
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// set static folder
app.use(express.static(path.join(__dirname, "public")));
// parse cookies
app.use(cookieParser(COOKIE_SECRET));

app.use("/v1/students", authenticate, require("./routers/studentRoute"));
app.use("/v1/admission", authenticate, require("./routers/admissionRoute"));
app.use("/v1/courses", authenticate, require("./routers/courseRoute"));
app.use("/v1/batches", authenticate, require("./routers/batchRoute"));
app.use("/v1/users", require("./routers/userRoute"));
app.use("/v1/settings", authenticate, require("./routers/settingsRoute"));

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
  error = err || { message: "500, Internal Server Error" };
  res.status(err.status || 500);
  res.json(error);
});

app.listen(PORT, () => {
  console.log(`SERVER is RUNNING http://localhost:${PORT}`);
  mongoose
    .connect(DB_URL)
    .then(() => console.log("Database connection successful!"))
    .catch((err) => console.log(err));
});
