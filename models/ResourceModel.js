const mongoose = require("mongoose");


const ResourceSchema = mongoose.Schema({
    resourceId: {
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
    private: {
        type: Boolean,
        default: false
    }

})

module.exports = mongoose.model("Resource", ResourceSchema);