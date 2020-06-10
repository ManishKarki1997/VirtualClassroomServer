// Model
const Chat = require('../models/ChatMessage');
const Class = require('../models/ClassModel');

function chatSocket(io) {

    io.on('connection', socket => {
        socket.on("JOIN_CLASS_CHAT", data => {
            socket.join(data.classId);
        })

        socket.on("SEND_NEW_MESSAGE", async (data) => {
            const { classId, message } = data;
            const chat = new Chat({
                classId,
                message,
                author: data.author._id
            })
            let newChat = await chat.save();
            // populate the newChat's author details
            newChat = await newChat.populate('author').execPopulate();
            const chatClass = await Class.findById(classId);
            chatClass.chatMessages.push(newChat._id);
            await chatClass.save();
            io.to(data.classId).emit("NEW_MESSAGE", newChat);
        })

    })
}

module.exports = chatSocket;