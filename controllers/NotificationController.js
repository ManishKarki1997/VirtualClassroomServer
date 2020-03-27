const express = require('express');
const Router = express.Router();
const Notification = require('../models/NotificationModel');

Router.get('/', async (req, res) => {
    return res.send({
        error: false,
        payload: { notifications: 'these are the available notifications' }
    })
})



Router.post('/', async (req, res) => {
    const { title, content, createdBy, classId } = req.body;
    try {
        const notification = new Notification({
            title,
            content,
            classId,
            createdBy
        })

        const result = await notification.save();
        return res.send({
            error: false,
            payload: { result }
        })
    } catch (error) {
        console.log(error)
        return res.send({
            error: true,
            message: error
        })
    }
})


module.exports = Router;