const express = require('express');
const Class = require('../models/ClassModel');
const User = require('../models/UserModel');
const Router = express.Router();
const Video = require('../models/VideoModel');
const verifyToken = require("../middlewares/verifyToken");


Router.get("/:classId", verifyToken, async (req, res) => {
    const { classId } = req.params;

    try {
        const videos = await Class.findById(classId).populate('videos');
        return res.send({
            error: false,
            message: "Successfully fetched class videos",
            payload: { videos: videos.videos }
        })
    } catch (error) {
        return res.send({
            error: true,
            message: "Something went wrong."
        })
    }
})

Router.post("/", verifyToken, async (req, res) => {
    try {
        const { classId, name, url } = req.body;

        const userClass = await Class.findById(classId);
        const video = new Video({
            classId,
            name,
            url
        })

        const savedVideo = await video.save();

        userClass.videos.push(savedVideo._id);
        await userClass.save();

        return res.send({
            error: false,
            message: "Video saved successfully",
            payload: { video: savedVideo }
        })

    } catch (error) {
        return res.send({
            error: true,
            message: "Something went wrong."
        })
    }
})


Router.put('/', verifyToken, async (req, res) => {
    const { videoId, name, url } = req.body;

    try {
        const video = await Video.findOneAndUpdate({ _id: videoId }, req.body, { new: true, }); // {new:true} returns updated video details

        return res.send({
            error: false,
            message: "Video details updated successfully.",
            payload: { video }
        })

    } catch (error) {
        return res.send({
            error: true,
            message: "Something went wrong."
        })
    }
})

Router.delete('/:videoId', verifyToken, async (req, res) => {
    const { videoId } = req.params;

    try {
        const video = await Video.findById(videoId).populate('createdBy');
        if (video.createdBy.email !== req.user.email) {
            return res.send({
                error: true,
                message: "You do not have the authority to perform this action."
            })
        }
        const deletedVideo = await Video.findByIdAndDelete(videoId);
        const videoClass = await Class.findById(deletedVideo.classId);
        videoClass.videos.splice(videoClass.videos.indexOf(deletedVideo._id), 1);
        await videoClass.save();

        return res.send({
            error: false,
            message: "Video deleted successfully",
            payload: { video: deletedVideo }
        })

    } catch (error) {
        return res.send({
            error: true,
            message: "Something went wrong."
        })
    }
})

module.exports = Router;