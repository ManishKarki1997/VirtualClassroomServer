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

// Create an assignment
Router.post("/", verifyToken, async (req, res) => {
  const { title, description, createdBy, classId, dueDate } = req.body;
  const theClass = await ClassModel.findById(classId);
  const assignment = new AssignmentModel({ ...req.body, yetToBeSubmittedBy: [...theClass.users] });
  const savedAssignment = await assignment.save();

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
});

module.exports = Router;
