const cloudinary = require("./cloudinary");

exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      next(); // skip to the next middleware
      return;
    }
    cloudinary.v2.uploader
      .upload_stream(
        {
          folder: "avatar",
          quality: 60,
          transformation: [
            {
              width: 300,
              height: 300,
              crop: "scale"
            }
          ]
        },
        (error, result) => {
          req.body.profileImageUrl = result.secure_url;
          req.body.profileImageName = result.public_id;
          // now we resize
          next();
        }
      )
      .end(req.file.buffer);

    // once we have written the photo to our filesystem, keep going!
    // check if there is no new file to resize
  } catch (error) {
    next(error);
  }
};
