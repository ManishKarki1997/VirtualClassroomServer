const mongoose = require("mongoose");


const UserSchema = mongoose.Schema({
    userId: {
        type: String,
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        required: true
    },
    passwordResetHash: {
        type: String
    },
    passwordResetExpiration: {
        type: Date
    },
    savedResources: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resource'
    }],
    notifications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Notification'
    }],
    joinedClasses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    }],
    createdClasses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    }]

})

module.exports = mongoose.model("User", UserSchema);