const express = require("express");
const Router = express.Router();
require("dotenv").config();

// Models
const Class = require("../models/ClassModel");
const User = require("../models/UserModel");
const ResourceFolder = require("../models/ResourceFolder");
const Notification = require("../models/NotificationModel");
const AssignmentModel = require("../models/AssignmentModel");

// Helpers
const deleteImage = require("../helpers/deleteFile");

// Middlewares
const assignmentUpload = require("../middlewares/assignmentUpload");
const verifyToken = require("../middlewares/verifyToken");
const ClassModel = require("../models/ClassModel");
const UserModel = require("../models/UserModel");
const { verify } = require("jsonwebtoken");

// -----------------------
//         Get
// -----------------------

// Create an assignment
Router.post("/", verifyToken, async (req, res) => {
  try {
    const { createdBy, classId } = req.body;
    const theClass = await ClassModel.findById(classId);
    const assignment = new AssignmentModel({ ...req.body, yetToBeSubmittedBy: [...theClass.users] });
    const savedAssignment = await assignment.save();
    theClass.assignments.push(savedAssignment._id);
    await theClass.save();

    if (theClass.users.length > 0) {
      await Promise.all(
        theClass.users.map(async (classUserId) => {
          const classUser = await UserModel.findById(classUserId);
          const notification = new Notification({
            title: "New Assignment",
            description: `You have a new assignment for the class <strong>${theClass.name}</strong>`,
            createdBy,
            classId,
            intendedForUser: true,
            intendedUser: classUserId,
          });
          const savedNotification = await notification.save();
          classUser.notifications.push(savedNotification._id);
          classUser.assignments.push(savedAssignment._id);
          await classUser.save();
        })
      );

      return res.send({
        error: false,
        message: "Assignment successfully created",
        payload: {
          assignment: savedAssignment,
        },
      });
    }
  } catch (error) {
    return res.send({
      error: true,
      message: "Something went wrong.",
    });
  }
});

// Get all assignments for a class
Router.get("/class/:classId", verifyToken, async (req, res) => {
  try {
    const { classId } = req.params;
    const theClass = await ClassModel.findById(classId).populate("assignments");
    return res.send({
      error: false,
      message: `Assignments successfully fetched for the class ${theClass.name}`,
      payload: {
        class: theClass,
      },
    });
  } catch (error) {
    return res.send({
      error: true,
      message: "Something went wrong",
    });
  }
});

// Get all assignments for a user
Router.get("/user/:userId", verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await UserModel.findById(userId);

    const assignments = await AssignmentModel.find({ classId: { $in: user.joinedClasses } }).populate("assignment");
    return res.send({
      error: false,
      message: "Successfully fetch your assignments",
      payload: {
        assignments,
      },
    });
  } catch (error) {
    return res.send({
      error: true,
      message: "Couldn't fetch your assignments",
    });
  }
});

// Get a single assignment
Router.get("/:assignmentId", verifyToken, async (req, res) => {
  try {
    const assignment = await AssignmentModel.findById(req.params.assignmentId).populate("submittedBy yetToBeSubmittedBy");
    return res.send({
      error: false,
      message: "Successfully fetch the assignment details",
      payload: {
        assignment,
      },
    });
  } catch (error) {
    return res.send({
      error: true,
      message: "Couldn't fetch the assignment details",
    });
  }
});

// Delete an assignment
Router.delete("/:assignmentId", verifyToken, async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await AssignmentModel.findOneAndDelete(assignmentId);
    return res.send({
      error: false,
      message: "Assignment deleted successfully",
      payload: {
        assignment,
      },
    });
  } catch (error) {
    return res.send({
      error: true,
      message: "Something went wrong while deleting the assignment.",
    });
  }
});

// -----------------------
//         Post
// -----------------------

// Submit an assignment
Router.post("/submit", verifyToken, assignmentUpload, async (req, res) => {
  try {
    const { assignmentId, userId, classId } = req.body;
    const user = await User.findById(userId);
    const assignment = await AssignmentModel.findById(assignmentId);

    assignment.assignmentFiles.push(req.file.filename);
    if (assignment.yetToBeSubmittedBy.indexOf(userId) > -1) {
      assignment.yetToBeSubmittedBy.splice(assignment.yetToBeSubmittedBy.indexOf(userId), 1);
      assignment.submittedBy.push(userId);
    }
    const savedAssignment = await assignment.save();

    const notification = new Notification({
      title: "Assignment Submitted",
      description: `${user.name} submitted his work for the assignment ${assignment.title}.`,
      intendedForUser: true,
      intendedUser: savedAssignment.createdBy,
      classId: savedAssignment.classId,
      createdBy: userId,
    });
    const savedNotification = await notification.save();

    user.notifications.push(savedNotification._id);
    await user.save();

    return res.send({
      error: false,
      message: "Assignment submitted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.send({
      error: true,
      message: "Something went wrong",
    });
  }
});

// Update assignment details
Router.put("/", verifyToken, async (req, res) => {
  try {
    const { assignmentId } = req.body;
    const assignment = await AssignmentModel.findOneAndUpdate(assignmentId, { ...req.body }, { new: true });
    return res.send({
      error: false,
      message: "Assignment updated successfully",
      payload: {
        assignment,
      },
    });
  } catch (error) {
    return res.send({
      error: true,
      message: "Something went wrong",
    });
  }
});

module.exports = Router;
