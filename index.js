require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const path = require("path");

// const db = require("./models/index");
const errorHandler = require("./handlers/error");
const articlesRoutes = require("./routes/articles");
const usersRoutes = require("./routes/users");
const commentRoutes = require("./routes/comments");

app.use(cors());
// app.use(express.static(path.join(__dirname, "public")));
// app.use("/uploads", express.static("uploads"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/articles", articlesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/comments", commentRoutes);

app.use(function(req, res, next) {
  let err = new Error("Not Found");
  err.status = 404;
  next(err);
});

app.use(errorHandler);

const port = process.env.PORT || 8081;

app.listen(port, () => {
  console.log(`Server is starting on port ${port}`);
});
