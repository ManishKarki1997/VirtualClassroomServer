const mongoose = require("mongoose");


const ChatMessageSchema = mongoose.Schema({
    classId: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
})

module.exports = mongoose.model("ChatMessage", ChatMessageSchema);