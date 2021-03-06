const mongoose = require("mongoose");

const ResourceSchema = mongoose.Schema({
  resourceId: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  description: {
    type: String,
    required: true,
  },
  resourceUrl: {
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
  private: {
    type: Boolean,
    default: false,
  },
  fileType: {
    type: String,
    default: "office",
  },
  fileSize: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Resource", ResourceSchema);
