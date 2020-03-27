const mongoose = require("mongoose");


const NotificationSchema = mongoose.Schema({
    notificationId: {
        type: String,
    },
    title: {
        type: String,
        required: true
    },
    content: {
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

})

module.exports = mongoose.model("Notification", NotificationSchema);