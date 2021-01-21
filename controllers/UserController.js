require("dotenv").config();
const express = require("express");
const Router = express.Router();
const bcrypt = require("bcryptjs");
const JWToken = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const nodemailer = require("nodemailer");

// Models
const User = require("../models/UserModel");
const Class = require("../models/ClassModel");
const Resource = require("../models/ResourceModel");
const ResourceFolder = require("../models/ResourceFolder");
const Notification = require("../models/NotificationModel");

// Helpers
const deleteFile = require("../helpers/deleteFile");

// Validators
const UserValidator = require("../validators/UserValidator");

// Middlewares
const imageUpload = require("../middlewares/imageUpload");
const verifyToken = require("../middlewares/verifyToken");

// User Signup
Router.post("/", imageUpload, async (req, res) => {
  const { name, email, password, contact, userType } = req.body;
  try {
    // Validate User Details
    delete req.body.image;
    const validationResult = UserValidator(req.body);

    if (validationResult.error) {
      if (req.file) {
        deleteFile(req.file.filename, "images");
      }
      return res.send({
        error: true,
        message: validationResult.error.details[0].message,
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // if the user uploaded an avatar image, delete it
      if (req.file) {
        deleteFile(req.file.filename, "images");
      }

      return res.send({
        error: true,
        message: "User with that email already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const accountConfirmationHash = await JWToken.sign(
      { email },
      process.env.JWT_SECRET_KEY
    );

    // create a new user
    const user = new User({
      userType,
      name,
      email,
      contact,
      avatar: req.file.filename,
      password: hashedPassword,
    });

    const result = await user.save();

    const resourceFolder = new ResourceFolder({
      userId: result._id,
      folderName: "Uncategorized",
    });

    const savedFolder = await resourceFolder.save();
    const savedUser = await User.findById(result._id);
    savedUser.resourceFolders.push(savedFolder._id);
    const updatedUser = await savedUser.save();

    // don't send password property
    result.password = undefined;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: "eclassroom@gmail.com",
      to: req.body.email,
      subject: "Verify your account",
      html: `
        <h1>Verify your account</h1>
        <p>Please click <a href='https://localhost:8080/accountconfirmation?token=${accountConfirmationHash}'>here</a> to verify your account.</p>
      `,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        return res.send({
          error: true,
          message: "Something went wrong",
        });
      } else {
        return res.send({
          error: false,
          message:
            "Registered Successfully. Please check your email and verify your account.",
        });
      }
    });

    // return the newly created user as the payload
    // return res.send({
    //   error: false,
    //   payload: {
    //     user: updatedUser,
    //   },
    // });
  } catch (error) {
    console.log(error);
    return res.send({
      error: true,
      message: error,
    });
  }
});

// User Login
Router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // fetch user from the database with that email
    const user = await User.findOne({ email });

    if (!user.isActive) {
      return res.send({
        error: true,
        message: "Please check your email and activate your account.",
      });
    }

    // compare passwords
    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.send({
        error: true,
        message: "Those credentials do not match.",
      });
    }

    // don't send password property
    user.password = undefined;

    // Create a json webtoken
    const jwtToken = JWToken.sign({ email }, process.env.JWT_SECRET_KEY);

    return res.send({
      error: false,
      payload: {
        user,
        jwtToken,
      },
    });
  } catch (error) {
    return res.send({
      error: true,
      message: "No user found with those credentials.",
    });
  }
});

// Confirm Account
Router.post("/confirmaccount", async (req, res) => {
  const { accountConfirmationHash } = req.body;

  try {
    const { email } = await JWToken.verify(
      accountConfirmationHash,
      process.env.JWT_SECRET_KEY
    );

    const user = await User.findOne({ email });
    user.isActive = true;

    await user.save();
    return res.send({
      error: false,
      message: "Account Verified. You can proceed to login now.",
    });
  } catch (error) {
    return res.send({
      error: true,
      message: "Invalid token. Please double check your email.",
    });
  }
});

// get user details
Router.get("/details", verifyToken, async (req, res) => {
  try {
    const { email } = req.user;
    const user = await User.findOne({ email });
    user.password = undefined;
    return res.send({
      error: false,
      payload: {
        user,
      },
    });
  } catch (error) {
    return res.send({
      error: true,
      message: "Something went wrong while fetching your profile",
      payload: error,
    });
  }
});

// request reset password
Router.post("/requestPasswordReset", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    const passwordResetToken = uuidv4();
    const currentDate = new Date();
    user.passwordResetToken = passwordResetToken;
    user.passwordResetTokenExpiryDate = currentDate.setHours(
      currentDate.getHours() + 2
    );
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: "eclassroom@gmail.com",
      to: req.body.email,
      subject: "Reset your password",
      html: `
        <h1>Reset Your Password</h1>
        <p>Please click <a href='https://localhost:8080/reset/${passwordResetToken}'>here</a> to reset your password</p>
        <p>Didn't request to reset your password? Kindly ignore this email.</p>
      `,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        return res.send({
          error: true,
          message: "Something went wrong",
        });
      } else {
        return res.send({
          error: false,
          message: "Please check your mail to reset the password",
        });
      }
    });
  } catch (error) {
    return res.send({
      error: true,
      message: "Something went wrong",
    });
  }
});

// reset password
Router.post("/resetPassword", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (new Date(user.passwordResetTokenExpiryDate) < Date.now()) {
      return res.send({
        error: true,
        message: "Password reset token expired.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    user.passwordResetTokenExpiryDate = "";
    user.passwordResetToken = "";
    await user.save();
    return res.send({
      error: false,
      message: "Password reset successfully.",
    });
  } catch (error) {
    return res.send({
      error: true,
      message:
        "Something went wrong while resetting your password. Please try again later.",
    });
  }
});

// Get user's enrolled or teaching classes detail
Router.get("/classes", verifyToken, async (req, res) => {
  try {
    const userClasses = await User.findOne({ email: req.user.email }).populate({
      path: "createdClasses joinedClasses ",
      populate: {
        path: "createdBy ",
      },
    });
    const { createdClasses, joinedClasses } = userClasses;
    return res.send({
      error: false,
      payload: { createdClasses, joinedClasses },
    });
  } catch (error) {
    return res.send({
      error: true,
      message: "Something went wrong.",
    });
  }
});

// User saves a resource in his personal collection
Router.post("/resources", verifyToken, async (req, res) => {
  const { userId, resourceId } = req.body;
  try {
    const userEmail = req.user.email;
    const userDetails = await User.findOne({ email: userEmail });

    if (!userDetails) {
      return res.send({
        error: true,
        message: "No user found with that email.",
      });
    }
    if (userDetails.savedResources.indexOf(resourceId) > -1) {
      return res.send({
        error: true,
        message: "This resource is already saved.",
      });
    }
    userDetails.savedResources.push(resourceId);
    const saved = await userDetails.save();
    return res.send({
      error: false,
      message: "Resource successfully saved.",
      payload: { resource: saved },
    });
  } catch (error) {
    console.log(error);
    return res.send({
      error: true,
      message: error,
    });
  }
});

// Get user's saved resources
Router.get("/resources", verifyToken, async (req, res) => {
  const userEmail = req.user.email;

  try {
    const userDetails = await User.findOne({ email: userEmail }).populate({
      path: "savedResources ",
      populate: {
        path: "classId",
      },
    });
    if (!userDetails) {
      return res.send({
        error: true,
        message: "User with that email does not exist!",
      });
    } else {
      return res.send({
        error: false,
        payload: { savedResources: userDetails.savedResources },
      });
    }
  } catch (error) {
    console.log(error);
    return res.send({
      error: true,
      message: error,
    });
  }
});

// Update user Details
Router.put("/", verifyToken, async (req, res) => {
  try {
    const originalEmail = req.user.email;
    const updatedUser = await User.findOneAndUpdate(
      { email: originalEmail },
      req.body,
      { new: true }
    ); // {new:true} returns updated user detail
    return res.send({
      error: false,
      message: "User updated successfully.",
      payload: {
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error(error);
    return res.send({
      error: true,
      message: "Something went wrong.",
    });
  }
});

// Update user avatar
Router.put("/avatar", verifyToken, imageUpload, async (req, res) => {
  const { email } = req.user;

  if (!req.file) {
    return res.send({
      error: true,
      message: "Please upload valid user avatar.",
    });
  } else {
    const filename = req.file.filename;

    const user = await User.findOne({ email });

    deleteFile(user.avatar, "images"); // delete old user avatar

    user.avatar = filename;

    const savedUser = await user.save();

    return res.send({
      error: false,
      message: "User avatar changed successfully.",
      payload: { user: savedUser },
    });
  }
});

// ---------------------- //
// Admin Controller //
// ---------------------- //

// Admin: dashboard meta info
Router.get("/admin/dashboardMetaInfo", verifyToken, async (req, res) => {
  const { email } = req.user;
  try {
    const totalUsersCounts = await User.countDocuments();
    const totalClassCounts = await Class.countDocuments();
    const totalResourcesCounts = await Resource.countDocuments();
    const totalFolderCounts = await Resource.countDocuments();

    const usersSample = await User.find({ userType: { $ne: "ADMIN" } }).limit(
      4
    );
    const classSample = await Class.find({}).limit(4).populate("createdBy");

    return res.send({
      error: false,
      payload: {
        totalUsersCounts,
        totalClassCounts,
        totalResourcesCounts,
        totalFolderCounts,
        usersSample,
        classSample,
      },
    });
  } catch (error) {
    console.log(error);
    return res.send({
      error: true,
      message: "Something went wrong.",
    });
  }
});

// Admin: all users
Router.get("/admin/users", verifyToken, async (req, res) => {
  try {
    const users = await User.find({ userType: { $ne: "ADMIN" } });
    return res.send({
      error: false,
      payload: {
        users,
      },
    });
  } catch (error) {
    return res.send({
      error: true,
      message: "Something went wrong.",
    });
  }
});

// Admin: all class resource folders
Router.get("/admin/classResourceFolders", verifyToken, async (req, res) => {
  try {
    const allFolders = await ResourceFolder.find({ isForClass: true }).populate(
      "resources"
    );
    return res.send({
      error: false,
      payload: {
        allFolders,
      },
    });
  } catch (error) {
    return res.send({
      error: true,
      message: "Something went wrong.",
    });
  }
});

// Admin: delete user
Router.post("/admin/kickout", verifyToken, async (req, res) => {
  try {
    const { userId, kickoutReason } = req.body;
    const adminEmail = req.user.email;

    const admin = await User.findOne({ email: adminEmail });
    if (admin.userType !== "ADMIN") {
      return res.send({
        error: true,
        message: "You do not have the permission to perform this action",
      });
    }

    const user = await User.findById(userId);
    if (user.isKickedOut) {
      return res.send({
        error: true,
        message: "User already kicked out from the app.",
      });
    }
    user.isKickedOut = true;

    const notification = new Notification({
      title: "You've been kicked out from the app.",
      description: kickoutReason,
      createdBy: admin._id,
      intendedForUser: true,
      intendedUser: user._id,
    });

    const savedNotification = await notification.save();
    user.notifications.push(savedNotification._id);
    await user.save();

    return res.send({
      error: false,
      message: "User successfully kicked out from the app.",
    });
  } catch (error) {
    console.log(error);
    return res.send({
      error: true,
      message: "Something went wrong.",
    });
  }
});

// Admin: make class private
Router.put("/admin/makeClassPrivate", verifyToken, async (req, res) => {
  try {
    const { userId, classId, reason } = req.body;

    const admin = await User.findById(userId);
    if (admin.userType !== "ADMIN") {
      return res.send({
        error: true,
        message: "You do not have the permission to perform this action.",
      });
    }
    const theClass = await Class.findById(classId);
    const result = theClass.private ? "public" : "private";
    theClass.private = !theClass.private;
    await theClass.save();

    const classOwner = await User.findById(theClass.createdBy);
    const notification = new Notification({
      title: "You've been kicked out from the app.",
      description: reason,
      createdBy: admin._id,
      intendedForUser: true,
      intendedUser: classOwner._id,
    });

    const savedNotification = await notification.save();
    classOwner.notifications.push(savedNotification._id);
    await classOwner.save();

    return res.send({
      error: false,
      message: `Class set to ${result} successfully`,
    });
  } catch (error) {
    console.log(error);
    return res.send({
      error: true,
      message: "Something went wrong",
    });
  }
});

module.exports = Router;
