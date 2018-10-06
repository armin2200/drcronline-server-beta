const jimp = require("jimp");
const uuid = require("uuid");

exports.resize = async (req, res, next) => {
  try {
    if (!req.file) {
      next(); // skip to the next middleware
      return;
    }
    const extension = req.file.mimetype.split("/")[1];
    const profileImage = `${uuid.v4()}.${extension}`;
    req.body.profileImageName = profileImage;
    // req.body.profileImageUrl = `${uuid.v4()}.${extension}`;
    // now we resize
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(200, jimp.AUTO);
    await photo.write(`uploads/avatar/${profileImage}`);
    req.body.profileImageUrl = `https://drcronline-server.herokuapp.com//uploads/avatar/${profileImage}`;
    // once we have written the photo to our filesystem, keep going!
    next();
    // check if there is no new file to resize
  } catch (error) {
    next(error);
  }
};
