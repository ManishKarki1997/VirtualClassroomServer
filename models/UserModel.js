const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
  userType: {
    type: String,
    default: "STUDENT",
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
    // required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },

  passwordResetHash: {
    type: String,
  },
  passwordResetExpiration: {
    type: Date,
  },
  isKickedOut: {
    type: Boolean,
    default: false,
  },
  savedResources: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resource",
    },
  ],
  resourceFolders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResourceFolder",
    },
  ],
  joinedClasses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },
  ],
  announcements: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Announcement",
    },
  ],
  createdClasses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },
  ],
  notifications: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Notification",
    },
  ],
  assignments: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Assignment",
    },
  ],
  passwordResetToken: {
    type: String,
    default: "0",
  },
  passwordResetTokenExpiryDate: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", UserSchema);
