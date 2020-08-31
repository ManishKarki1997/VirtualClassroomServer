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
  assignments: [],
  submittedBy: [],
  yetToBeSubmittedBy: [],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Assignment", AssignmentSchema);