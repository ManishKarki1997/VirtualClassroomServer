const express = require("express");
const Router = express.Router();
const bcrypt = require("bcryptjs");
const JWToken = require("jsonwebtoken");
require("dotenv").config();

// Models
const User = require("../models/UserModel");
const Class = require("../models/ClassModel");
const ResourceFolder = require("../models/ResourceFolder");

// Helpers
const deleteFile = require("../helpers/deleteFile");

// Validators
const UserValidator = require("../validators/UserValidator");

// Middlewares
const imageUpload = require("../middlewares/imageUpload");
const verifyToken = require("../middlewares/verifyToken");

// User Signup
Router.post("/", imageUpload, async (req, res) => {
  const { name, email, image, password, contact } = req.body;
  try {
    // Validate User Details
    const validationResult = UserValidator.validate(req.body);
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

    // create a new user
    const user = new User({
      name,
      email,
      contact,
      avatar: req.file.filename,
      password: hashedPassword,
    });

    // create and send JW token
    const jwtToken = JWToken.sign({ email }, process.env.JWT_SECRET_KEY);

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

    // return the newly created user as the payload
    return res.send({
      error: false,
      payload: {
        user: updatedUser,
        jwtToken,
      },
    });
  } catch (error) {
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
    const updatedUser = await User.findOneAndUpdate({ email: originalEmail }, req.body, { new: true }); // {new:true} returns updated user detail
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

module.exports = Router;
