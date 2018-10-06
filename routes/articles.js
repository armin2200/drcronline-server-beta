const express = require("express");
const multer = require("multer");
const router = express.Router({ mergeParams: true });
const {
  loginRequired,
  ensureCorrectUser,
  isAdmin
} = require("../middleware/auth");
const { Article } = require("../models/index");
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function(req, file, cb) {
    cb(null, new Date().toISOString() + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  // reject a file
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  },
  fileFilter: fileFilter
});
router.get("/", async (req, res, next) => {
  try {
    const article = await Article.find().select("-__v");

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

router.post("/photos", upload.single("image"), async (req, res, next) => {
  try {
    res.status(201).json({
      image: "http://" + req.headers.host + "/uploads/" + req.file.filename
    });
  } catch (error) {
    next(error);
  }
});

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
