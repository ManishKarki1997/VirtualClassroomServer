const express = require("express");
const Class = require("../models/ClassModel");
const User = require("../models/UserModel");
const Router = express.Router();
const Notification = require("../models/NotificationModel");
const { verify } = require("jsonwebtoken");
const verifyToken = require("../middlewares/verifyToken");

// get notifications for a user
Router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate({
      path: "notifications",
      populate: {
        path: "classId",
      },
    });
    const sortedNotifications = user.notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.send({
      error: false,
      payload: sortedNotifications,
    });
  } catch (error) {
    console.log("error", error);
    return res.send({
      error: true,
      message: error,
    });
  }
});

// create a notification
Router.post("/", async (req, res) => {
  const { title, content, createdBy, classId } = req.body;
  try {
    const notification = new Notification({
      title,
      content,
      classId,
      createdBy,
    });

    const result = await notification.save();

    const theClass = await Class.findById(classId);

    // await Promise.all(theClass.users.map(async userId => {
    //     const user = await User.findById(userId)
    //     user.notifications.push(result._id);
    //     await user.save();
    // }))

    // theClass.notifications.push(result._id);
    await theClass.save();

    return res.send({
      error: false,
      payload: { result },
    });
  } catch (error) {
    return res.send({
      error: true,
      message: error,
    });
  }
});

// mark a notification as read
Router.post("/read", verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.body.notificationId);
    if (notification && notification.notificationReadByUser !== undefined) {
      notification.notificationReadByUser = true;
    }
    await notification.save();
    return res.send({
      error: false,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.log(error);
    return res.send({
      error: true,
      message: "Something went wrong while marking the notification as read.",
      payload: error,
    });
  }
});

module.exports = Router;
