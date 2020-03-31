const Joi = require('@hapi/joi');

const classroomSchema = Joi.object({
    name: Joi.string()
        .required(),

    description: Joi.string()
        .required(),

    createdBy: Joi.string()
        .required(),

    shortInfo: Joi.string()
        .required(),

    startTime: Joi.string().required(),

    endTime: Joi.string().required()
})


module.exports = classroomSchema;