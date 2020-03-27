const express = require('express');
const Router = express.Router();
const bcrypt = require('bcryptjs');
const JWToken = require('jsonwebtoken');
require('dotenv').config();


// Models
const User = require('../models/UserModel');
const Class = require('../models/ClassModel');

// Helpers
const deleteImage = require('../helpers/deleteImage');

// Validators
const UserValidator = require('../validators/UserValidator');

// Middlewares
const imageUpload = require('../middlewares/imageUpload');
const verifyToken = require('../middlewares/verifyToken');



// Router.get('/', async (req, res) => {
//     return res.send({
//         error: false,
//         payload: { users: 'these are the available users' }
//     })
// })


// User Signup
Router.post('/', imageUpload, async (req, res) => {
    const { name, email, image, password, contact } = req.body;
    try {

        // Validate User Details
        const validationResult = UserValidator.validate(req.body);
        if (validationResult.error) {
            if (req.file) {
                deleteImage(req.file.filename)
            }
            return res.send({
                error: true,
                message: validationResult.error.details[0].message
            })
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            // if the user uploaded an avatar image, delete it
            if (req.file) {
                deleteImage(req.file.filename)
            }

            return res.send({
                error: true,
                message: "User with that email already exists"
            })
        }


        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // create a new user
        const user = new User({
            name,
            email,
            contact,
            avatar: req.file.filename,
            password: hashedPassword
        })

        // create and send JW token
        const jwtToken = JWToken.sign({ email }, process.env.JWT_SECRET_KEY);

        const result = await user.save();

        // return the newly created user as the payload
        return res.send({
            error: false,
            payload: {
                user: result,
                jwtToken
            }

        })
    } catch (error) {
        return res.send({
            error: true,
            message: error
        })
    }
})

// User Login
Router.post('/login', async (req, res) => {
    console.log(process.env.JWT_SECRET_KEY)
    const { email, password } = req.body;

    try {

        // fetch user from the database with that email
        const user = await User.findOne({ email });

        // compare passwords
        const passwordMatches = await bcrypt.compare(password, user.password);

        if (!passwordMatches) {
            return res.send({
                error: true,
                message: "Those credentials do not match."
            })
        }

        // Create a json webtoken
        const jwtToken = JWToken.sign({ email }, process.env.JWT_SECRET_KEY);

        return res.send({
            error: false,
            payload: {
                user,
                jwtToken
            }
        })

    } catch (error) {
        return res.send({
            error: true,
            message: "No user found with those credentials."
        })
    }
})




module.exports = Router;