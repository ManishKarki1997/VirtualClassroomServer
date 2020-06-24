const express = require("express");
const Router = express.Router();
require("dotenv").config();

// Models
const Class = require("../models/ClassModel");
const User = require("../models/UserModel");
const ChatMessage = require("../models/ChatMessage");

// Middlewares
const verifyToken = require("../middlewares/verifyToken");

Router.get("/:classId", verifyToken, async (req, res) => {
  try {
    const { classId } = req.params;
    const chatMessages = await Class.findById(classId).populate({
      path: "chatMessages",
      populate: {
        path: "author",
        select: "-password",
      },
    });

    return res.send({
      error: false,
      message: "Successfully retrieved class chat messages.",
      payload: {
        chatMessages: chatMessages ? chatMessages.chatMessages : [],
      },
    });
  } catch (error) {
    return res.send({
      error: true,
      message: "Something went wrong while fetching the chat messages.",
      payload: error,
    });
  }
});

module.exports = Router;
