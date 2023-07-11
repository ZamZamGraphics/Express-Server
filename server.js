const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
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

app.use(morgan("dev"));
app.use(cors());

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// set static folder
app.use(express.static(path.join(__dirname, "public")));
// parse cookies
app.use(cookieParser(COOKIE_SECRET));

app.use("/api/v1/students", authenticate, require("./routers/studentRoute"));
app.use("/api/v1/admission", authenticate, require("./routers/admissionRoute"));
app.use("/api/v1/courses", authenticate, require("./routers/courseRoute"));
app.use("/api/v1/batches", authenticate, require("./routers/batchRoute"));
app.use("/api/v1/users", require("./routers/userRoute"));

// API Home Route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome To Our Application",
  });
});

// 404 not found handler
app.use((req, res, next) => {
  next(createError(404, "Your requested content was not found!"));
});

// common error handler
app.use((err, req, res, next) => {
  error =
    process.env.NODE_ENV === "development"
      ? err
      : { message: "Internal Server Error" };
  console.log(error);
  res.status(err.status || 500);
  res.json(error);
});

app.listen(PORT, () => {
  console.log(`SERVER is RUNNING ON PORT ${PORT}`);
  mongoose
    .connect(DB_URL)
    .then(() => console.log("Database connection successful!"))
    .catch((err) => console.log(err));
});
