const mongoose = require("mongoose");

articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 10
    },
    subTitle: {
      type: String,
      required: true,
      trim: true,
      minlength: 10
    },

    body: {
      type: String,
      required: true,
      trim: true,
      minlength: 10
    },

    author: {
      type: String,
      minlength: 2,
      trim: true,
      default: "Shawn Shahpari"
    },
    readTime: {
      type: Number,
      required: true
    },
    views: { type: Number, default: 0 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
      }
    ]
  },
  { timestamps: true }
);

const Article = mongoose.model("Article", articleSchema);

module.exports = Article;
