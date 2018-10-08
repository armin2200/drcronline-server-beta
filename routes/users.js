const express = require("express");
const router = express.Router({ mergeParams: true });
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const { User, Token } = require("../models/index");
const { resize } = require("../handlers/resize");
const { loginRequired, ensureCorrectUser } = require("../middleware/auth");
const mail = require("../handlers/mail");

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

router.post("/signin", async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    const { _id, fullname, profileImageUrl, email, isAdmin } = user;
    const isMatch = await user.comparePassword(req.body.password);
    if (!isMatch) {
      return next({
        status: 400,
        message: "Invalid Email or Password!"
      });
    }
    if (!user.isVerified) {
      return next({
        status: 401,
        message: "Your account has not been verified."
      });
    }
    let token = user.generateAuthToken();
    return res
      .status(200)
      .json({ _id, fullname, email, profileImageUrl, isAdmin, token });
  } catch (error) {
    return next({
      status: 400,
      message: "Invalid Email or Password!"
    });
  }
});

router.post("/signup", async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    // const { _id, fullname, profileImageUrl } = user;
    // let token = user.generateAuthToken();
    const tokenConfirm = await Token.create({
      _userId: user._id,
      token: crypto.randomBytes(16).toString("hex")
    });
    const resetURL = `https://drcronline.com/confirmation/${
      tokenConfirm.token
    }`;
    await mail.send({
      user,
      filename: "Account-Verification",
      subject: "Account Verification",
      resetURL
    });
    return res.status(200).json({
      message: `A verification email has been sent to ${user.email}.`
    });
    // return res.status(200).json({
    //   _id,
    //   fullname,
    //   profileImageUrl,
    //   token
    // });
  } catch (err) {
    const messages = [];
    if (err.code === 11000) {
      // err.message = "User already registered.";
      messages.push("User already registered.");
    } else {
      for (field in err.errors) {
        messages.push(err.errors[field].message);
      }
    }

    return next({
      message: messages
    });
  }
});
router.post("/confirmation", async (req, res, next) => {
  try {
    const token = await Token.findOne({ token: req.body.token });
    if (!token)
      return next({
        status: 400,
        message:
          "We were unable to find a valid link. Your link may have expired."
      });

    const user = await User.findOne({ _id: token._userId });
    if (!user)
      return next({
        status: 400,
        message: "We were unable to find a user for this link ."
      });

    if (user.isVerified)
      return next({
        status: 400,
        message: "This user has already been verified."
      });

    user.isVerified = true;
    await user.save();
    return res
      .status(200)
      .json({ message: "The account has been verified. Please log in." });
  } catch (error) {
    next(error);
  }
});
router.post("/confirmationResend", async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user)
      return next({
        status: 400,
        message: "We were unable to find a user with that email."
      });

    if (user.isVerified)
      return res.status(400).json({
        error: {
          message: "This account has already been verified. Please log in.",
          type: "already-verified"
        }
      });

    // Create a verification token, save it, and send email
    var tokenConfirm = await Token.create({
      _userId: user._id,
      token: crypto.randomBytes(16).toString("hex")
    });
    const resetURL = `https://drcronline.com/confirmation/${
      tokenConfirm.token
    }`;
    await mail.send({
      user,
      filename: "Account-Verification",
      subject: "Account Verification",
      resetURL
    });
    return res.status(200).json({
      message: `A verification email has been sent to ${user.email}.`
    });
  } catch (error) {
    next(error);
  }
});
router.post("/reset", async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(200).json({
        message:
          "Password reset link was emailed, given you entered the correct email address."
      });
    }
    user.resetPasswordToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordExpires = Date.now() + 3600000; //1 hour from now
    await user.save();
    const resetURL = `https://drcronline.com/reset/${user.resetPasswordToken}`;
    await mail.send({
      user,
      filename: "password-reset",
      subject: "Password Reset",
      resetURL
    });
    return res.status(200).json({
      message:
        "Password reset link was emailed, given you entered the correct email address."
    });
  } catch (error) {
    next(error);
  }
});
router.get("/reset/:token", async (req, res, next) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) {
      return next({
        status: 400,
        message: "Password reset link is invalid or has been expired."
      });
    }
    return res.status(200).json({
      message: `Hi ${user.fullname} please reset your Password`
    });
  } catch (error) {
    next(error);
  }
});
router.put("/reset/:token", async (req, res, next) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) {
      return next({
        status: 400,
        message: "Password reset link is invalid or has been expired."
      });
    }
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    return res
      .status(200)
      .json({ message: "Your Password has been reset, please login again." });
  } catch (error) {
    next(error);
  }
});

router.patch(
  "/:userId/profile",
  loginRequired,
  ensureCorrectUser,
  multer(multerOptions).single("profileImageUrl"),
  resize,
  async (req, res, next) => {
    try {
      const updatedUser = await User.findById(req.params.userId);
      if (req.body.password && req.body.newPassword) {
        const isMatch = await updatedUser.comparePassword(req.body.password);
        if (!isMatch) {
          return next({
            status: 400,
            message: "Your old password is Invalid!"
          });
        }
        req.body.password = req.body.newPassword;
      }
      const profileImageName = updatedUser.profileImageName;
      for (const key in req.body) {
        updatedUser[key] = req.body[key];
      }
      if (!updatedUser.profileImageUrl) {
        updatedUser.profileImageName = undefined;
      }
      await updatedUser.save();
      const token = updatedUser.generateAuthToken();
      if (req.body.hasPicChange === "true" && profileImageName) {
        fs.unlink(`uploads/avatar/${profileImageName}`, err => {
          if (err) {
            console.log("failed to delete local image:" + err);
          } else {
            console.log("successfully deleted local image");
          }
        });
      }
      const { _id, fullname, profileImageUrl } = updatedUser;

      return res.status(200).json({
        _id,
        fullname,
        profileImageUrl,
        token
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
