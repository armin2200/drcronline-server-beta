const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      trim: true,
      required: true,
      minlength: 2,
      maxlength: 50
    },
    email: {
      type: String,
      trim: true,
      required: true,
      lowercase: true,
      minlength: 5,
      maxlength: 255,
      match: [
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
        "Please fill a valid email address"
      ],
      unique: true
    },
    password: {
      type: String,
      trim: true,
      required: true,
      minlength: 7,
      maxlength: 1024
    },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
      }
    ],
    profileImageUrl: {
      type: String
    },
    profileImageName: {
      type: String
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Article" }],

    isAdmin: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    resetPasswordToken: String,
    resetPasswordExpires: Date
  },
  { timestamps: true }
);

userSchema.pre("save", async function(next) {
  try {
    if (!this.isModified("password")) {
      return next();
    }
    let hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
    return next();
  } catch (err) {
    return next(err);
  }
});
userSchema.methods.generateAuthToken = function() {
  const token = jwt.sign(
    {
      _id: this._id,
      isAdmin: this.isAdmin,
      fullname: this.fullname,
      profileImageUrl: this.profileImageUrl,
      email: this.email,
      isAdmin: this.isAdmin
    },
    process.env.SECRET_KEY
  );
  return token;
};

userSchema.methods.comparePassword = async function(candidatePassword, next) {
  try {
    let isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
  } catch (err) {
    next(err);
  }
};

const User = mongoose.model("User", userSchema);

module.exports = User;
