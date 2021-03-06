const mongoose = require("mongoose");
require("dotenv").config();

mongoose.set("debug", true);
mongoose.Promise = Promise;
mongoose
  .connect(
    process.env.MONGODB_URI,
    {
      keepAlive: true
    }
  )
  .then(() => console.log("Connected to MongoDB..."))
  .catch(err => {
    console.log(err.message);
  });

module.exports.Article = require("./article");
module.exports.User = require("./user");
module.exports.Comment = require("./comment");
module.exports.Token = require("./token");

// module.exports = mongoose;
