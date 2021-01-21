const Joi = require("joi");

const userSchema = Joi.object({
  email: Joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
    .required()
    .messages({
      "string.email": `Invalid email format`,
      "string.empty": `"Email" cannot be field`,
    }),

  password: Joi.string()
    .min(6)
    .max(32)
    .pattern(new RegExp("^[a-zA-Z0-9]{6,32}$"))
    .messages({
      "string.empty": `"Password" cannot be field`,
      "string.min": `Password must be at least {#limit} characters long`,
      "string.max": `Password must be at max {#limit} characters long`,
    }),

  avatar: Joi.string(),
  userType: Joi.string().messages({
    "string.empty": `"UserType" cannot be field`,
  }),

  name: Joi.string().min(2).max(40).required().messages({
    "string.empty": `"Name" cannot be field`,
    "string.min": `Name must be at least {#limit} characters long`,
    "string.max": `Name must be at max {#limit} characters long`,
  }),
});

const userValidator = (body) => {
  return userSchema.validate(body);
};

module.exports = userValidator;
