const mongoose = require("mongoose");
const { boolean } = require("@hapi/joi");

const NotificationSchema = mongoose.Schema({
  notificationId: {
    type: String,
  },
  title: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  imagePurposeType: {
    type: String,
  },
  imageTargetUrl: {
    type: String,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  },
  resourceUrl: {
    type: String,
  },
  intendedForUser: {
    type: Boolean,
    default: false,
  },
  intendedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  notificationReadByUser: {
    type: Boolean,
    default: false,
  },
  readBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("Notification", NotificationSchema);
