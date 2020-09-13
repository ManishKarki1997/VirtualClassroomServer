const express = require("express");
const Router = express.Router();
require("dotenv").config();

// Models
const Class = require("../models/ClassModel");
const User = require("../models/UserModel");
const ResourceFolder = require("../models/ResourceFolder");
const Notification = require("../models/NotificationModel");
const AssignmentModel = require("../models/AssignmentModel");
const UserAssignmentModel = require("../models/UserAssignmentModel");

// Helpers
const deleteFile = require("../helpers/deleteFile");

// Middlewares
const assignmentUpload = require("../middlewares/assignmentUpload");
const verifyToken = require("../middlewares/verifyToken");
const ClassModel = require("../models/ClassModel");
const UserModel = require("../models/UserModel");
const { verify } = require("jsonwebtoken");
const { assign } = require("nodemailer/lib/shared");

// -----------------------
//         Get
// -----------------------

// Get all assignments for a class
Router.get("/class/:classId", verifyToken, async (req, res) => {
  try {
    const { classId } = req.params;
    const theClass = await ClassModel.findById(classId).populate("assignments");
    return res.send({
      error: false,
      message: `Assignments successfully fetched for the class ${theClass.name}`,
      payload: {
        assignments: theClass.assignments,
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

    const sortOption = req.query.sortBy || "dueDate";
    const user = await UserModel.findById(userId);
    let assignments = [];
    if (sortOption === "notSubmitted") {
      const tempAssignments = await AssignmentModel.find({ classId: { $in: user.joinedClasses } })
        .populate("assignment classId")
        .sort({ createdAt: 1 });

      assignments = tempAssignments.filter((assignment) => assignment.yetToBeSubmittedBy.indexOf(userId) > -1);
    } else {
      assignments = await AssignmentModel.find({ classId: { $in: user.joinedClasses } })
        .populate("assignment classId")
        .sort({ [sortOption]: 1 });
    }

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
    const assignment = await AssignmentModel.findById(req.params.assignmentId)
      .populate({
        path: "approved",
        populate: {
          path: "userId",
        },
      })
      .populate({
        path: "rejected",
        populate: {
          path: "userId",
        },
      })
      .populate({
        path: "submittedBy",
        populate: {
          path: "userId",
        },
      })
      .populate("yetToBeSubmittedBy");
    return res.send({
      error: false,
      message: "Successfully fetch the assignment details",
      payload: {
        assignment,
      },
    });
  } catch (error) {
    console.log(error);
    return res.send({
      error: true,
      message: "Couldn't fetch the assignment details",
    });
  }
});

// Get student submitted assignment file
Router.get("/submittedAssignment/:assignmentId", verifyToken, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { email } = req.user;
    const user = await User.findOne({ email });

    const userAssignment = await UserAssignmentModel.findOne({ assignmentId, userId: user._id });
    return res.send({
      error: false,
      message: "Successfully fetched your submitted assignment",
      payload: {
        userAssignment,
      },
    });
  } catch (error) {
    return res.send({
      error: true,
      message: "Something went wrong fetching your submitted assignment.",
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
            title: `New Assignment for the class <strong>${theClass.name}</strong>`,
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

// Submit an assignment
Router.post("/submit", verifyToken, assignmentUpload, async (req, res) => {
  try {
    const { assignmentId, userId, note } = req.body;
    const user = await User.findById(userId);
    const assignment = await AssignmentModel.findById(assignmentId);
    const existingUserAssignment = await UserAssignmentModel.findOne({ userId, assignmentId });

    if (existingUserAssignment) {
      if (req.file) {
        deleteFile(req.file.filename, "assignments");
      }
      return res.send({
        error: true,
        message: "You've already submitted your assignment.",
      });
    }

    const userAssignment = new UserAssignmentModel({
      userId,
      assignmentId,
      note,
      classId: assignment.classId,
      assignmentFileName: req.file.filename,
    });

    const savedUserAssignment = await userAssignment.save();

    assignment.submittedBy.push(savedUserAssignment._id);

    if (assignment.yetToBeSubmittedBy.indexOf(userId) > -1) {
      assignment.yetToBeSubmittedBy.splice(assignment.yetToBeSubmittedBy.indexOf(userId), 1);
    }
    const savedAssignment = await assignment.save();

    const notification = new Notification({
      title: `Assignment Submitted for ${assignment.title}`,
      description: `${user.name} submitted his work for the assignment <strong>${assignment.title}</strong>.`,
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
      payload: {
        savedAssignment,
      },
    });
  } catch (error) {
    console.log(error);
    return res.send({
      error: true,
      message: "Something went wrong",
    });
  }
});

// Approve or Reject student assignment
Router.post("/decision", verifyToken, async (req, res) => {
  try {
    const { assignmentId, userAssignmentId, decision, userId } = req.body;
    const assignment = await AssignmentModel.findById(assignmentId);

    if (!assignment.createdBy.equals(userId)) {
      return res.send({
        error: true,
        message: "You do not have the permission to perform this action",
      });
    }

    if (decision === "APPROVE") {
      if (assignment.approved.indexOf(userAssignmentId) > -1) {
        assignment.approved.push(userAssignmentId);
      }

      if (assignment.rejected.indexOf(userAssignmentId) > -1) {
        assignment.rejected.splice(assignment.rejected.indexOf(userAssignmentId), 1);
      }

      if (assignment.yetToBeSubmittedBy.indexOf(userAssignmentId) > -1) {
        assignment.yetToBeSubmittedBy.splice(assignment.yetToBeSubmittedBy.indexOf(userAssignmentId), 1);
      }
    } else if (decision === "REJECT") {
      assignment.rejected.push(userAssignmentId);
    } else {
      return res.send({
        error: true,
        message: "Invalid decision",
      });
    }

    await assignment.save();
    return res.send({
      error: false,
      message: `Assignment successfully ${decision.toLowerCase()}ed`,
    });
  } catch (error) {
    return res.send({
      error: true,
      message: "Something went wrong.",
    });
  }
});

// -----------------------
//         Put
// -----------------------

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

// Update assignment file
Router.put("/submit", verifyToken, assignmentUpload, async (req, res) => {
  try {
    const { assignmentId, note, userId, userAssignmentId } = req.body;
    const assignment = await AssignmentModel.findById(assignmentId);
    const userAssignment = await UserAssignmentModel.findById(userAssignmentId);
    const classUser = await User.findById(assignment.createdBy);
    const user = await UserModel.findById(userId);

    if (req.file) {
      deleteFile(userAssignment.assignmentFileName, "assignments");
      userAssignment.assignmentFileName = req.file.filename;
    }

    userAssignment.note = note || userAssignment.note;

    const savedUserAssignment = await userAssignment.save();

    const notification = new Notification({
      title: "Assignment Updated",
      description: `${user.name} updated his submission for the assignment ${assignment.title}.`,
      intendedForUser: true,
      intendedUser: savedUserAssignment.userId,
      classId: savedUserAssignment.classId,
      createdBy: savedUserAssignment.userId,
    });
    const savedNotification = await notification.save();
    classUser.notifications.push(savedNotification._id);
    await classUser.save();

    return res.send({
      error: false,
      message: "Assignment updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.send({
      error: true,
      message: "Something went wrong.",
    });
  }
});

module.exports = Router;
