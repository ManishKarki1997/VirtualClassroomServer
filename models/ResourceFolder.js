const mongoose = require("mongoose");

const ResourceFolderSchema = mongoose.Schema({
  folderName: {
    type: String,
    default: "Uncategorized",
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resources: [
    {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Resource",
    },
  ],
});

module.exports = mongoose.model("ResourceFolder", ResourceFolderSchema);
