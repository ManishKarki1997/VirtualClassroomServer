const mongoose = require("mongoose");

const AnnouncementSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
  },
  readBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Announcement", AnnouncementSchema);
