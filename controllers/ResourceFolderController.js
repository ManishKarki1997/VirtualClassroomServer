const express = require("express");
const Router = express.Router();
require("dotenv").config();

// Models
const User = require("../models/UserModel");
const Class = require("../models/ClassModel");
const Resource = require("../models/ResourceModel");
const ResourceFolder = require("../models/ResourceFolder");

const verifyToken = require("../middlewares/verifyToken");
const { verify } = require("jsonwebtoken");

// Get users' folders and the resources
Router.get("/", verifyToken, async (req, res) => {
  try {
    const { email } = req.user;
    const userResourceFolders = await User.findOne({ email }).populate({
      path: "resourceFolders ",
      populate: {
        path: "resources ",
      },
    });
    return res.send({
      error: false,
      message: "Resource folders fetched successfully",
      payload: {
        userResourceFolders: userResourceFolders.resourceFolders,
      },
    });
  } catch (error) {
    return res.send({
      error: true,
      message: "Something went wrong while fetching the resources",
      payload: {
        error,
      },
    });
  }
});

// Get all resource folders of all classes for a user
Router.get("/allResources", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });

    const userResourceFolders = await ResourceFolder.find({ isForClass: false, userId: user._id }).populate("resources");
    const userJoinedClasses = user.joinedClasses;
    const userCreatedClasses = user.createdClasses;

    let allResourcesFolders = [];
    await Promise.all(
      userCreatedClasses.map(async (userClass) => {
        const classResourceFolders = await ResourceFolder.findOne({ classId: userClass, isForClass: true, userId: user._id }).populate({
          path: "resources classId",
          populate: {
            path: "resourceFolders",
            populate: {
              path: "resources",
            },
          },
        });

        allResourcesFolders.push({
          className: classResourceFolders.classId.name,
          classDescription: classResourceFolders.classId.description,
          classId: classResourceFolders.classId._id,
          resourceFolders: classResourceFolders.classId.resourceFolders,
        });
      })
    );
    await Promise.all(
      userJoinedClasses.map(async (userClass) => {
        const classResourceFolders = await ResourceFolder.findOne({ classId: userClass, isForClass: true, userId: user._id }).populate({
          path: "resources classId",
          populate: {
            path: "resourceFolders",
            populate: {
              path: "resources",
            },
          },
        });

        allResourcesFolders.push({
          className: classResourceFolders.classId.name,
          classDescription: classResourceFolders.classId.description,
          classId: classResourceFolders.classId._id,
          resourceFolders: classResourceFolders.classId.resourceFolders,
        });
      })
    );
    return res.send({
      error: false,
      userResourceFolders,
      resourceFolders: allResourcesFolders,
    });
  } catch (error) {
    console.log(error);
    return res.send({
      error: true,
      message: "Something went wrong while fetching class resources",
      payload: {
        error,
      },
    });
  }
});

// Get a folder's resources
Router.get("/:folderId", verifyToken, async (req, res) => {
  try {
    const { email } = req.user;
    const user = await User.findOne({ email });
    const folder = await ResourceFolder.findById(req.params.folderId).populate("resources");
    if (!folder.userId.equals(user._id)) {
      return res.send({
        error: true,
        message: "You do not have the permission to perform this action",
        payload: {
          folder,
        },
      });
    }
    return res.send({
      error: false,
      message: "Resource folders fetched successfully",
      payload: {
        folder,
      },
    });
  } catch (error) {
    return res.send({
      error: true,
      message: "Something went wrong while fetching the resources",
      payload: {
        error,
      },
    });
  }
});

// Create a resource folder
Router.post("/", verifyToken, async (req, res) => {
  try {
    const { folderName, userId } = req.body;

    const existingFoldernameByUser = await ResourceFolder.findOne({ userId, folderName });
    if (existingFoldernameByUser) {
      return res.send({
        error: true,
        message: "You already have a folder with that name",
      });
    }
    const resourceFolder = new ResourceFolder({
      folderName,
      userId,
    });
    const newResourceFolder = await resourceFolder.save();
    const user = await User.findById(userId);
    user.resourceFolders.push(newResourceFolder._id);
    await user.save();
    return res.send({
      error: false,
      message: "Folder created successfully",
      payload: {
        resourceFolder: newResourceFolder,
      },
    });
  } catch (error) {
    return res.send({
      error: true,
      message: "Failed to create the folder",
      payload: {
        error,
      },
    });
  }
});

// Rename the folder
Router.put("/rename", verifyToken, async (req, res) => {
  try {
    const { userId, folderId, newFolderName } = req.body;

    const folder = await ResourceFolder.findById(folderId);
    if (!folder) {
      return res.send({
        error: true,
        message: "Could not find a folder with that name",
      });
    }

    if (!folder.userId.equals(userId)) {
      return res.send({
        error: true,
        message: "You do not have the permission to perform this action.",
      });
    }

    folder.folderName = newFolderName;
    const renamedFolder = await folder.save();
    return res.send({
      error: false,
      message: "Folder renamed successfully",
      payload: {
        folder: renamedFolder,
      },
    });
  } catch (error) {
    return res.send({
      error: true,
      message: "Failed to rename the folder",
      payload: {
        error,
      },
    });
  }
});

// Delete the folder
Router.delete("/:folderId", verifyToken, async (req, res) => {
  try {
    const folder = await ResourceFolder.findById(req.params.folderId);
    const { email } = req.user;
    const user = await User.findOne({ email });

    if (!folder) {
      return res.send({
        error: true,
        message: "Something went wrong while deleting the folder",
        payload: {
          error,
        },
      });
    }

    if (!folder.userId.equals(user._id)) {
      return res.send({
        error: true,
        message: "You do not have the permission to perform this action",
        payload: {
          error,
        },
      });
    }

    user.resourceFolders = user.resourceFolders.filter((rFolder) => rFolder !== req.params.folderId);
    await user.save();
    const deletedFolder = await ResourceFolder.findOneAndDelete(req.params.folderId);
    return res.send({
      error: false,
      message: "Folder deleted successfully",
      payload: {
        deletedFolder,
      },
    });
  } catch (error) {
    return res.send({
      error: true,
      message: "Something went wrong while deleting the folder",
      payload: {
        error,
      },
    });
  }
});

// Add resource to folder
Router.post("/addResource", verifyToken, async (req, res) => {
  try {
    const { userId, folderId, resourceId } = req.body;
    // console.log(req.body);

    const resourceFolder = await ResourceFolder.findById(folderId);
    if (!resourceFolder.userId.equals(userId)) {
      return res.send({
        error: true,
        message: "You do not have the permission to perform this action",
      });
    }

    const alreadyExists = resourceFolder.resources.filter((r) => r.equals(resourceId));
    if (alreadyExists.length > 0) {
      return res.send({
        error: true,
        message: "The resource already exists in the folder",
      });
    }
    resourceFolder.resources.push(resourceId);
    const savedResource = await resourceFolder.save();
    return res.send({
      error: false,
      message: "Resource added successfully",
      payload: {
        savedResource,
      },
    });
  } catch (error) {
    console.log(error);
    return res.send({
      error: true,
      message: "Something went wrong while adding the resource to the folder",
      payload: {
        error,
      },
    });
  }
});

// Delete resource from folder
Router.post("/deleteResource", verifyToken, async (req, res) => {
  try {
    const { resourceId, folderId, userId } = req.body;
    const user = await User.findById(userId);
    const folder = await ResourceFolder.findById(folderId);
    if (!folder.userId.equals(user._id)) {
      return res.send({
        error: true,
        message: "You do not have the permission to perform this operation",
        payload: {
          error,
        },
      });
    }

    folder.resources = folder.resources.filter((r) => r !== resourceId);
    const savedFolder = await folder.save();
    return res.send({
      error: false,
      message: "Resource deleted successfully from the folder",
      payload: {
        savedFolder,
      },
    });
  } catch (error) {
    return res.send({
      error: true,
      message: "Something went wrong while deleting the resource from the folder",
      payload: {
        error,
      },
    });
  }
});
module.exports = Router;
