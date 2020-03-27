const mongoose = require("mongoose");


const ClassSchema = mongoose.Schema({
    classId: {
        type: String,
    },
    name: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    backgroundImage: {
        type: String,
    },
    private: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    resources: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resource'
    }],
    notifications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Notification'
    }],
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]



})

module.exports = mongoose.model("Class", ClassSchema);