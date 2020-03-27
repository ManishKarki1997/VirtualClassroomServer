const Joi = require('@hapi/joi');

const userSchema = Joi.object({
    email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
        .required(),

    password: Joi.string()
        .pattern(new RegExp('^[a-zA-Z0-9]{8,30}$')),

    avatar: Joi.string(),

    name: Joi.string()
        .min(4)
        .max(36),

    contact: Joi.number()
        // .min(9)
        // .max(12)
        .required()
})

module.exports = userSchema;