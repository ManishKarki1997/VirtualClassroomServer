const express = require("express");
const Router = express.Router();
require("dotenv").config();

const fs = require("fs");
const path = require("path");

// Models
const User = require("../models/UserModel");
const Class = require("../models/ClassModel");
const Resource = require("../models/ResourceModel");
const ResourceFolder = require("../models/ResourceFolder");
const Notification = require("../models/NotificationModel");
const Announcement = require("../models/AnnouncementModel");

const verifyToken = require("../middlewares/verifyToken");

// Get user's annoucement details
Router.get("/:userId", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate({
      path: "announcements",
      populate: {
        path: "classId ",
      },
    });
    return res.send({
      error: false,
      payload: {
        announcements: user.announcements,
      },
    });
  } catch (error) {
    return res.send({
      error: true,
      message: "Couldn't fetch announcements for you right now.",
    });
  }
});

// Make an announcement
Router.post("/", verifyToken, async (req, res) => {
  try {
    const { title, userId, classId, description } = req.body;

    const theClass = await Class.findById(classId);

    const announcement = new Announcement({
      title,
      description,
      userId,
      classId,
    });
    const savedAnnouncement = await announcement.save();
    theClass.announcements.push(savedAnnouncement._id);
    await theClass.save();

    const classUsers = theClass.users;
    await Promise.all(
      classUsers.map((userId) => {
        User.findById(userId).then((user) => {
          user.announcements.push(savedAnnouncement._id);
          return user.save();
        });
      })
    );

    return res.send({
      error: false,
      message: "Announcement made successfully",
      payload: {
        announcement: savedAnnouncement,
      },
    });
  } catch (error) {
    console.log(error);
    return res.send({
      error: true,
      message: "Something went wrong while making the announcement",
      payload: {
        error,
      },
    });
  }
});

module.exports = Router;
