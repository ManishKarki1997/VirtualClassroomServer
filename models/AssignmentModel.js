const mongoose = require("mongoose");

const AssignmentSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
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
  dueDate: {
    type: Date,
    required: true,
  },
  submittedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAssignment",
    },
  ],
  yetToBeSubmittedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  approved: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAssignment",
    },
  ],
  rejected: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAssignment",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Assignment", AssignmentSchema);
