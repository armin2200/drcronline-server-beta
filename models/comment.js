const mongoose = require("mongoose");
const User = require("./user");
const Article = require("./article");

const commentSchema = new mongoose.Schema(
  {
    body: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1024
    },
    user: {
      type: new mongoose.Schema({
        fullname: {
          type: String,
          trim: true,
          required: true,
          minlength: 2,
          maxlength: 50
        },
        profileImageUrl: {
          type: String
        }
      })
    },
    article: {
      type: new mongoose.Schema({
        title: {
          type: String,
          required: true,
          trim: true,
          minlength: 10
        }
      })
    }
  },
  {
    timestamps: true
  }
);

commentSchema.pre("remove", async function(next) {
  try {
    const user = await User.findById(this.user._id);
    const article = await Article.findById(this.article._id);
    article.comments.remove(this.id);
    user.comments.remove(this.id);
    await article.save();
    await user.save();
    return next();
  } catch (error) {
    next(error);
  }
});

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
