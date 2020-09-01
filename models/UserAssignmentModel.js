const mongoose = require("mongoose");
const { string } = require("@hapi/joi");

const UserAssignmentSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
  },
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assignment",
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  assignmentFileName: {
    type: String,
    required: true,
  },
  note: {
    type: String,
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("UserAssignment", UserAssignmentSchema);
