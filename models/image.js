const mongoose = require("mongoose");

const ImageSchema = mongoose.Schema(
  {
    type: String,
    data: Buffer
  },
  {
    timestamps: true
  }
);
const Image = mongoose.model("Image", ImageSchema);
module.exports = Image;
