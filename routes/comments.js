const express = require("express");
const router = express.Router({ mergeParams: true });
const { Comment, User, Article } = require("../models/index");
const { loginRequired, ensureCorrectUser } = require("../middleware/auth");

router.post(
  "/:userId",
  loginRequired,
  ensureCorrectUser,
  async (req, res, next) => {
    try {
      const foundUser = await User.findById(req.params.userId);
      const foundArticle = await Article.findById(req.body.articleId);
      const comment = await Comment.create({
        body: req.body.body,
        user: {
          _id: foundUser._id,
          fullname: foundUser.fullname,
          profileImageUrl: foundUser.profileImageUrl
        },
        article: { _id: foundArticle._id, title: foundArticle.title }
      });
      foundArticle.comments.push(comment._id);
      foundUser.comments.push(comment._id);

      await foundArticle.save();
      await foundUser.save();
      res.status(200).json({
        _id: comment._id,
        body: req.body.body,
        user: {
          fullname: foundUser.fullname,
          profileImageUrl: foundUser.profileImageUrl
        }
      });
    } catch (error) {
      next(error);
    }
  }
);
// .get(async (req, res, next) => {
//   try {
//     const comments = await Comment.findby().select("-_v");
//     res.status(200).json(comments);
//   } catch (error) {
//     next(error);
//   }
// });

module.exports = router;
