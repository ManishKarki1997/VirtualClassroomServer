const mongoose = require("mongoose");

const NotificationSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  image: {
    type: String,
  },
  type: {
    type: String,
    default: "Notification",
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
  extraInfo: {
    type: Object,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Notification", NotificationSchema);
