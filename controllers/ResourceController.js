const express = require('express');
const Router = express.Router();
const Resource = require('../models/ResourceModel');

Router.get('/', async (req, res) => {
    return res.send({
        error: false,
        payload: { resources: 'these are the available resources' }
    })
})



Router.post('/', async (req, res) => {
    const { name, subject, createdBy, classId, } = req.body;
    try {
        const resource = new Resource({
            name,
            subject,
            classId,
            createdBy
        })

        const result = await resource.save();
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


module.exports = Router;