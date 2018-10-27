const cloudinary = require("./cloudinary");
const { User } = require("../models/index");
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      next(); // skip to the next middleware
      return;
    }
    const isAdmin = await User.findById(req.params.userId).select(
      "isAdmin -_id"
    );
    if (isAdmin) {
      cloudinary.v2.uploader
        .upload_stream(
          {
            folder: "article",
            width: 850
          },
          (error, result) => {
            req.body.ImageUrl = result.secure_url;
            //   req.body.ImageName = result.public_id;
            // now we resize
            next();
          }
        )
        .end(req.file.buffer);
    } else {
      return next({ status: 403, message: "Access denied." });
    }

    // once we have written the photo to our filesystem, keep going!
    // check if there is no new file to resize
  } catch (error) {
    next(error);
  }
};
