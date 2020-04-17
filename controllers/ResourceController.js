const express = require('express');
const Router = express.Router();

// Models import
const Resource = require('../models/ResourceModel');
const Class = require('../models/ClassModel');
const Notification = require("../models/NotificationModel");
const User = require("../models/UserModel");


// helpers
const deleteFile = require('../helpers/deleteFile');

// Middlewares
const resourceUpload = require('../middlewares/resourceUpload');
const verifyToken = require('../middlewares/verifyToken');


// fetch all resources of a class
Router.get('/:classId', async (req, res) => {

    const { classId } = req.params;

    try {

        const resources = await Class.findById(classId).populate('resources');
        return res.send({
            error: false,
            payload: { resources: resources.resources }
        })

    } catch (error) {
        return res.send({
            error: true,
            message: "Something went wrong."
        })
    }
})


// Create a resource
Router.post('/', verifyToken, resourceUpload, async (req, res) => {

    const { name, description, createdBy, classId } = req.body;
    const { email } = req.user;

    try {
        const theClass = await Class.findById(classId);
        const user = await User.findOne({ email });


        // create a new resource
        const resource = new Resource({
            name,
            description,
            classId,
            createdBy,
            resourceUrl: req.file.filename,

        })

        const notification = new Notification({
            title: `${user.name} has added a file in ${theClass.name}.`,
            createdBy: user._id,
            classId: classId,
        })

        const savedNotification = await notification.save();

        // save the resource to the database
        const result = await resource.save();

        // push the resource reference to the class' resources array
        theClass.resources.push(result._id);

        // push the notification reference to the class' notifications array
        theClass.notifications.push(savedNotification._id);

        // save the class
        await theClass.save();

        return res.send({
            error: false,
            payload: { result }
        })

    } catch (error) {
        // if something goes wrong, delete the uploaded file
        if (error) {
            deleteFile(req.file.filename, 'resources');
        }
        return res.send({
            error: true,
            message: error
        })
    }
})


// Delete Resource
Router.delete('/', verifyToken, async (req, res) => {
    const { resourceId, classId, userId } = req.body.payload;

    try {


        const resource = await Resource.findById(resourceId);
        const theClass = await Class.findById(classId);

        // if the resource does not belong to the class or the user didn't create the resource,
        // deny the permission to perform the action
        if (!resource.classId.equals(classId) || !resource.createdBy.equals(userId)) {
            return res.send({
                error: true,
                message: "You do not have the authority to delete the file."
            })
        }





        // delete the resource
        await Resource.findOneAndDelete(resourceId);

        // delete the resource file from the storage
        deleteFile(resource.resourceUrl, 'resources');

        // delete the resource reference from the class' resources array
        theClass.resources.splice(theClass.resources.indexOf(resourceId), 1);

        // save the class
        await theClass.save();

        return res.send({
            error: false,
            message: "The file has been successfully deleted."
        })


    } catch (error) {
        return res.send({
            error: true,
            message: error
        })
    }
})

// Fetch all resources of user's classes
Router.get('/user/resources', verifyToken, async (req, res) => {
    try {
        const { email } = req.user;

        const user = await User.findOne({ email });
        const userClasses = user.joinedClasses;
        let allResources = []
        await Promise.all(userClasses.map(async (userClass) => {
            const classResources = await Class.findById(userClass).populate('resources');
            allResources.push({
                className: classResources.name,
                classId: classResources._id,
                resources: classResources.resources
            })
        }))
        return res.send(allResources);



    } catch (error) {
        console.log(error)
    }
})


module.exports = Router;