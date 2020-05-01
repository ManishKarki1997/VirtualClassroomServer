const mongoose = require("mongoose");


const NotificationSchema = mongoose.Schema({
    notificationId: {
        type: String,
    },
    title: {
        type: String,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    resourceUrl: {
        type: String,
    },
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now()
    }

})

module.exports = mongoose.model("Notification", NotificationSchema);