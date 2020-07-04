const express = require("express");
const Class = require("../models/ClassModel");
const User = require("../models/UserModel");
const Router = express.Router();
const Notification = require("../models/NotificationModel");

Router.get("/:userId", async (req, res) => {
  try {
    // const notifications = await User.findById(req.params.userId);
    const user = await User.findById(req.params.userId).populate("notifications");
    return res.send({
      error: false,
      payload: user.notifications,
    });
  } catch (error) {
    return res.send({
      error: true,
      message: error,
    });
  }
});

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

module.exports = Router;
