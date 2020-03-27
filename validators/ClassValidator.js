const Joi = require('@hapi/joi');

const classroomSchema = Joi.object({
    name: Joi.string()
        .required(),

    description: Joi.string()
        .required(),

    createdBy: Joi.string()
        .required(),

    subject: Joi.string()
        .required()
})


module.exports = classroomSchema;