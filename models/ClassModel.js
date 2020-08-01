const mongoose = require("mongoose");

const ClassSchema = mongoose.Schema({
  classId: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  shortInfo: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  backgroundImage: {
    type: String,
  },
  private: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  pendingJoinRequests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  resourceFolders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResourceFolder",
    },
  ],
  resources: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resource",
    },
  ],
  announcements: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Announcement",
    },
  ],
  notifications: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Notification",
    },
  ],
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  videos: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
    },
  ],
  chatMessages: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatMessage",
    },
  ],
});

module.exports = mongoose.model("Class", ClassSchema);
