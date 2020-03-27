const express = require('express');
const Router = express.Router();
require('dotenv').config();

// Models
const Class = require('../models/ClassModel');
const User = require('../models/UserModel');


// Helpers
const deleteImage = require('../helpers/deleteImage');

// Validators
const ClassValidator = require('../validators/ClassValidator');

// Middlewares
const imageUpload = require('../middlewares/imageUpload');
const verifyToken = require('../middlewares/verifyToken');


// Fetch all classes
Router.get('/', verifyToken, async (req, res) => {
    try {
        const classes = await Class.find({ private: false }).populate('createdBy');
        return res.send({
            error: false,
            payload: { classes }
        })

    } catch (error) {
        return res.send({
            error: true,
            message: "Something went wrong"
        })
    }

})


// Create a new class
Router.post('/', verifyToken, imageUpload, async (req, res) => {

    const { name, subject, description, backgroundImage, createdBy, private } = req.body;

    try {

        // Validate class details
        const validationResult = ClassValidator.validate(req.body);

        if (validationResult.error) {
            // If the user uploaded a class background image, delete it
            if (req.file) {
                deleteImage(req.file.filename)
            }
            return res.send({
                error: true,
                message: validationResult.error.details[0].message
            })
        }

        // retrieve the user details 
        const user = await User.findById(createdBy);
        // If the user doesn't exist, send appropriate response
        if (!user) {

            if (req.file) {
                deleteImage(req.file.filename)
            }

            return res.send({
                error: true,
                message: "Something went wrong."
            })
        }

        // create a new class
        const newClass = new Class({
            name,
            subject,
            description,
            backgroundImage: req.file.filename,
            createdBy,
            private
        })

        const result = await newClass.save();

        // add the newly created class reference to that user
        user.createdClasses.push(result._id);
        await user.save();

        return res.send({
            error: false,
            payload: { result }
        })

    } catch (error) {
        return res.send({
            error: true,
            message: error
        })
    }
})


// User joins the class
Router.post('/join', verifyToken, async (req, res) => {
    const { userId, classId } = req.body;

    try {
        // fetch the user details
        const user = await User.findById(userId);

        // if the user has already joined the class, return error message
        if (user.joinedClasses.indexOf(classId) > -1) {
            return res.send({
                error: true,
                message: "You've already joined the class."
            })
        }

        // push the class id to the user's joinedClasses array
        user.joinedClasses.push(classId);

        await user.save();

        return res.send({
            error: false,
            payload: { user }
        })

    } catch (error) {
        console.log(error)
        return res.send({
            error: true,
            message: "Something went wrong."
        })
    }

})


// Edit classroom details
Router.put('/', verifyToken, imageUpload, async (req, res) => {

    const { classId, name, subject, description, private } = req.body;

    try {


        // Update the class
        let newClass = await Class.findOneAndUpdate({ _id: classId }, req.body, { new: true });

        // if the user changed the class background image, 
        if (req.file) {
            // delete the old background image file
            deleteImage(newClass.backgroundImage);
            // set the newly selected image as the background image
            newClass.backgroundImage = req.file.filename
        }
        await newClass.save();

        return res.send({
            error: false,
            payload: {
                class: newClass
            }
        })

    } catch (error) {

        // in case of error, if user uploaded an image, delete it
        if (req.file) {
            deleteImage(req.file.filename);
        }

        return res.send({
            error: true,
            message: "Something went wrong."
        })
    }
})

// Delete Classroom
Router.delete("/:classId", verifyToken, async (req, res) => {
    const { classId } = req.params;

    try {

        // retrieve the user details
        let user = await User.findOne({ email: req.user.email });

        // retrieve the class details
        const classToDelete = await Class.findById(classId);

        // if the class' creatorid matches the id of the user
        if (classToDelete.createdBy.equals(user._id)) {

            // delete the background image of the class
            deleteImage(classToDelete.backgroundImage);

            // remove the classid reference from user's createdClasses array
            user.createdClasses.splice(user.createdClasses.indexOf(classId), 1);

            // save the updated user details
            await user.save();

            // delete the class
            await Class.deleteOne({ _id: classId });

            return res.send({
                error: false,
                message: "Class Successfully Deleted."
            })

        } else {
            return res.send({
                error: true,
                message: "You do not have the permission to perform this action."
            })
        }


    } catch (error) {
        console.log(error)
        return res.send({
            error: true,
            message: "Something went wrong."
        })
    }
})


module.exports = Router;