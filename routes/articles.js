const express = require("express");
const multer = require("multer");
const router = express.Router({ mergeParams: true });
const {
  loginRequired,
  ensureCorrectUser,
  isAdmin
} = require("../middleware/auth");
const { Article } = require("../models/index");
const { uploadImage } = require("../handlers/uploadImageOfArticles");

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith("image/");
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: "That filetype isn't allowed!" }, false);
    }
  }
};
router.get("/", async (req, res, next) => {
  try {
    const article = await Article.find()
      .select("-__v")
      .sort({ createdAt: -1 });

    res.status(200).json(article);
  } catch (err) {
    next(err);
  }
});
router.post(
  "/:userId",
  loginRequired,
  ensureCorrectUser,
  isAdmin,
  async (req, res, next) => {
    try {
      const article = await Article.create(req.body);

      return res.status(201).json(article);
    } catch (err) {
      const messages = [];
      for (field in err.errors) {
        messages.push(err.errors[field].message);
      }

      return next({
        message: messages
      });
    }
  }
);

router.post(
  "/:userId/photos",
  loginRequired,
  ensureCorrectUser,
  multer({ multerOptions }).single("image"),
  uploadImage,
  async (req, res, next) => {
    try {
      res.status(201).json({
        image: req.body.ImageUrl
      });
    } catch (error) {
      next(error);
    }
  }
);

router
  .route("/:articleId")
  .get(async (req, res, next) => {
    try {
      const article = await Article.findById(req.params.articleId)
        .select("-__v")
        .populate("comments", "body user createdAt ");
      if (req.query.view === "true") {
        article.views += 1;
        await article.save();
      }
      if (!article)
        return next({
          status: 404,
          message: "Not found page!"
        });
      return res.status(200).json(article);
    } catch (err) {
      return next(err);
    }
  })
  .patch(async (req, res, next) => {
    try {
      //runValidators:true;
      const updatedArticle = await Article.findById(req.params.articleId);
      for (const key in req.body) {
        updatedArticle[key] = req.body[key];
      }
      await updatedArticle.save();
      res.status(200).json(updatedArticle);
    } catch (err) {
      next(err);
    }
  })
  .delete(async (req, res, next) => {
    try {
      const removedArticle = await Article.findByIdAndRemove(
        req.params.articleId
      );
      res.status(200).json(removedArticle);
    } catch (err) {
      next(err);
    }
  });

module.exports = router;
