const express = require("express");
const Router = express.Router();
require("dotenv").config();

// Models
const Class = require("../models/ClassModel");
const User = require("../models/UserModel");
const ResourceFolder = require("../models/ResourceFolder");
const Notification = require("../models/NotificationModel");

// Helpers
const deleteImage = require("../helpers/deleteFile");

// Validators
const ClassValidator = require("../validators/ClassValidator");

// Middlewares
const imageUpload = require("../middlewares/imageUpload");
const verifyToken = require("../middlewares/verifyToken");

// Fetch all classes
Router.get("/", verifyToken, async (req, res) => {
  try {
    const classes = await Class.find({ private: false }).populate("createdBy");
    return res.send({
      error: false,
      payload: { classes },
    });
  } catch (error) {
    return res.send({
      error: true,
      message: "Something went wrong",
    });
  }
});

// Create a new class
Router.post("/", verifyToken, imageUpload, async (req, res) => {
  const { name, shortInfo, description, startTime, endTime, createdBy, private } = req.body;

  try {
    // Validate class details
    const validationResult = ClassValidator.validate(req.body);

    if (validationResult.error) {
      // If the user uploaded a class background image, delete it
      if (req.file) {
        //remove spaces, reason being frontend not rendering images from background:url() if the url doesn't escape spaces
        deleteImage(req.file.filename.trim().replace(/\s/g, ""), "images");
      }
      return res.send({
        error: true,
        message: validationResult.error.details[0].message,
      });
    }

    if (!startTime || !endTime) {
      if (req.file) {
        deleteImage(req.file.filename, "images");
      }
      return res.send({
        error: true,
        message: "Please specify start and end time of the class.",
      });
    }

    // retrieve the user details
    const user = await User.findById(createdBy);
    // If the user doesn't exist, send appropriate response
    if (!user) {
      if (req.file) {
        deleteImage(req.file.filename, "images");
      }

      return res.send({
        error: true,
        message: "Something went wrong.",
      });
    }

    // create a new class
    const newClass = new Class({
      name,
      shortInfo,
      description,
      backgroundImage: req.file.filename,
      createdBy,
      private,
      startTime,
      endTime,
    });

    const result = await newClass.save();

    const resourceFolder = new ResourceFolder({
      folderName: name,
      userId: createdBy,
      classId: result._id,
      isForClass: true,
    });

    const savedResourceFolder = await resourceFolder.save();

    const classWithUserDetails = await Class.findById(result._id).populate("createdBy");
    classWithUserDetails.resourceFolders.push(savedResourceFolder._id);
    await classWithUserDetails.save();

    // add the newly created class reference to that user
    user.createdClasses.push(result._id);
    await user.save();

    return res.send({
      error: false,
      payload: { result: classWithUserDetails },
    });
  } catch (error) {
    console.log(error);
    return res.send({
      error: true,
      message: error,
    });
  }
});

Router.get("/:classId/students", verifyToken, async (req, res) => {
  try {
    const { classId } = req.params;
    const classroom = await Class.findById(classId).populate("users");
    return res.send({
      error: false,
      payload: {
        users: classroom.users,
      },
    });
  } catch (error) {
    console.log(error);
    return res.send({
      error: true,
      message: "Something went wrong retrieving the classroom students",
      payload: error,
    });
  }
});

// User joins the class
Router.post("/join", verifyToken, async (req, res) => {
  const { userId, classId } = req.body;

  try {
    // fetch the user details
    const user = await User.findById(userId);

    const classToJoin = await Class.findById(classId);

    if (classToJoin.pendingJoinRequests.indexOf(userId) > -1) {
      return res.send({
        error: true,
        message: "Please wait until the class teacher accepts your request.",
      });
    }

    // if the user has already joined the class, leave the class
    if (user.joinedClasses.indexOf(classId) > -1) {
      return res.send({
        error: false,
        message: "You're already enrolled in the class.",
      });
    } else {
      // push the user id to the class' pendingJoinRequests array
      // classToJoin.users.push(userId); //delete it after making routes for teacher to accept or reject join requests
      if (classToJoin.pendingJoinRequests.indexOf(userId) == -1) {
        classToJoin.pendingJoinRequests.push(userId);
        await classToJoin.save();
        await user.save();

        return res.send({
          error: false,
          message: "Request sent. You'll join the class when the class teacher accepts the request.",
        });
      } else {
        await classToJoin.save();
        await user.save();

        return res.send({
          error: false,
          message: "Please wait until the class teacher accepts your request.",
        });
      }
    }
  } catch (error) {
    console.log(error);
    return res.send({
      error: true,
      message: "Something went wrong.",
    });
  }
});

// Leaves joins the class
Router.post("/leave", verifyToken, async (req, res) => {
  const { userId, classId } = req.body;

  try {
    // fetch the user details
    const user = await User.findById(userId);

    const classToJoin = await Class.findById(classId);

    // if the user has already joined the class, leave the class
    if (user.joinedClasses.indexOf(classId) > -1) {
      user.joinedClasses.splice(user.joinedClasses.indexOf(classId), 1);
      classToJoin.users.splice(classToJoin.users.indexOf(userId), 1);
      // classToJoin.pendingJoinRequests.splice(classToJoin.users.indexOf(userId), 1);

      await user.save();
      await classToJoin.save();

      return res.send({
        error: false,
        message: "You've left the class.",
      });
    }
  } catch (error) {
    console.log(error);
    return res.send({
      error: true,
      message: "Something went wrong.",
    });
  }
});

// Edit classroom details
Router.put("/", verifyToken, imageUpload, async (req, res) => {
  const { classId, name, shortInfo, description, private } = req.body;

  try {
    // Update the class
    let newClass = await Class.findOneAndUpdate({ _id: classId }, req.body, { new: true });

    // if the user changed the class background image,
    if (req.file) {
      // delete the old background image file
      deleteImage(newClass.backgroundImage, "images");
      // set the newly selected image as the background image
      newClass.backgroundImage = req.file.filename;
    }
    await newClass.save();

    return res.send({
      error: false,
      payload: {
        class: newClass,
      },
    });
  } catch (error) {
    // in case of error, if user uploaded an image, delete it
    if (req.file) {
      deleteImage(req.file.filename, "images");
    }

    return res.send({
      error: true,
      message: "Something went wrong.",
    });
  }
});

// Delete Classroom
Router.delete("/:classId", verifyToken, async (req, res) => {
  const { classId } = req.params;

  try {
    // retrieve the user details
    let user = await User.findOne({ email: req.user.email });

    // retrieve the class details
    const classToDelete = await Class.findById(classId);

    // if the class' creatorid matches the id of the user
    if (classToDelete.createdBy.equals(user._id)) {
      // delete the background image of the class
      deleteImage(classToDelete.backgroundImage, "images");

      // remove the classid reference from user's createdClasses array
      user.createdClasses.splice(user.createdClasses.indexOf(classId), 1);

      // save the updated user details
      await user.save();

      // delete the class
      await Class.deleteOne({ _id: classId });

      return res.send({
        error: false,
        message: "Class Successfully Deleted.",
      });
    } else {
      return res.send({
        error: true,
        message: "You do not have the permission to perform this action.",
      });
    }
  } catch (error) {
    console.log(error);
    return res.send({
      error: true,
      message: "Something went wrong.",
    });
  }
});

// Get a class' pending join requests user details
Router.get("/pendingrequests/:classId", verifyToken, async (req, res) => {
  const { classId } = req.params;

  try {
    const theClass = await Class.findById(classId).populate("pendingJoinRequests");
    return res.send({
      error: false,
      payload: { pendingJoinRequests: theClass.pendingJoinRequests },
    });
  } catch (error) {
    return res.send({
      error: true,
      message: "Something went wrong.",
    });
  }
});

// Accept/Reject student join request
Router.post("/pendingrequests/accept", verifyToken, async (req, res) => {
  const { classId, decision, userId } = req.body;

  try {
    const classToJoin = await Class.findById(classId);

    // the join request is denied if the decision equals 'accept'
    if (decision === "reject") {
      classToJoin.pendingJoinRequests.splice(classToJoin.pendingJoinRequests.indexOf(userId), 1);
      await classToJoin.save();

      const notification = new Notification({
        title: `Your request to join the class '${classToJoin.name}' has been rejected.`,
        classId,
        createdBy: classToJoin.createdBy,
        intendedForUser: true,
        intendedUser: userId,
        image: classToJoin.backgroundImage,
        imagePurposeType: "ClassRequest",
        imageTargetUrl: classToJoin._id,
      });

      const savedNotification = notification.save();
      const theUser = await User.findById(userId);
      theUser.notifications.push(savedNotification._id);
      await theUser.save();

      return res.send({
        error: false,
        message: "The request to join the class has been denied.",
      });
    } else if (decision === "accept") {
      // if the class teacher accepted the request,
      // remove the userId from the pendingRequests array
      // add the userId to the class users array
      const user = await User.findById(userId);
      user.joinedClasses.push(classId);
      classToJoin.pendingJoinRequests.splice(classToJoin.pendingJoinRequests.indexOf(userId), 1);
      classToJoin.users.push(userId);

      const notification = new Notification({
        title: `Your request to join the class ${classToJoin.name} has been accepted.`,
        classId,
        createdBy: classToJoin.createdBy,
        intendedForUser: true,
        intendedUser: userId,
        image: classToJoin.backgroundImage,
        imagePurposeType: "ClassRequest",
        imageTargetUrl: classToJoin._id,
      });

      const savedNotification = await notification.save();
      user.notifications.push(savedNotification._id);
      await user.save();
      await classToJoin.save();

      return res.send({
        error: false,
        message: "The request to join the class has been accepted.",
      });
    }
  } catch (error) {
    console.log(error);
    return res.send({
      error: true,
      message: "Something went wrong.",
    });
  }
});

// find upcoming classes
Router.get("/upcoming", verifyToken, async (req, res) => {
  try {
    const { email } = req.user;
    const user = await User.findOne({ email }).populate("joinedClasses");
    const userClasses = user.joinedClasses.slice(0, 4);

    const timeFormattedUserClasses = userClasses.map((c) => ({
      ...c._doc,
      amOrPm: c.startTime.split(" ")[1],
      numericStartTime: c.startTime.split(" ")[0].split(":"),
    }));

    const date = new Date();

    // get the hours and minutes for current time
    const hrs = date.toLocaleTimeString().split(" ")[0].split(":")[0];
    const minutes = date.toLocaleTimeString().split(" ")[0].split(":")[1];
    // const currentAmOrPm = date.toLocaleTimeString().split(" ")[1];

    // current time in seconds
    const currentTimeInNumbers = hrs * 60 * 60 + minutes * 60;

    // basically find the number of seconds for upcoming class
    // looks ugly, but works...
    // slightly overestimates the time by a couple minutes

    const formattedClassWithTime = timeFormattedUserClasses.map((c) => {
      // class start time in seconds = class' scheduled start time in seconds - current time in seconds
      let startTimeInSeconds = c.numericStartTime[0] * 60 * 60 + c.numericStartTime[1] * 60 - currentTimeInNumbers;

      // if start time < 0 i.e. if they are 12 hrs apart. for example, 1:00 am class schedule time, but current time is 2:00 pm
      // just add 12 hrs -> 12 * 60 * 60 seconds in start time
      if (startTimeInSeconds < 0) {
        // currentAmOrPm !== c.amOrPm
        startTimeInSeconds = startTimeInSeconds + 12 * 60 * 60;
      }
      return {
        ...c,
        upcomingClassTimeInSeconds: startTimeInSeconds,
      };
    });

    const sortedUpcomingClass = formattedClassWithTime.sort((a, b) => a.upcomingClassTimeInSeconds - b.upcomingClassTimeInSeconds);

    return res.send({
      error: false,
      message: "Successfully fetched upcoming classes",
      payload: {
        upcomingClasses: sortedUpcomingClass,
      },
    });
  } catch (error) {
    console.log(error);
    return res.send({
      error: true,
      message: "Something went wrong fetching your upcoming classes",
      payload: {
        error,
      },
    });
  }
});

module.exports = Router;
