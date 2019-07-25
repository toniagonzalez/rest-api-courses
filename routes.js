const express = require('express');
const app = express();
const router = express.Router();
const { Sequelize, sequelize, models } = require('./models');
const { User, Course } = models;
const auth = require('basic-auth');
const bcryptjs = require('bcryptjs');
const { check, validationResult } = require('express-validator');


//Asychronous Function Handler
function asyncHandler(cb){
    return async (req,res,next) => {
        try {
            await cb(req,res,next);
        } catch(err){
            next(err);
        }
    }
}


//Authorization Handler
const authenticateUser = async (req,res,next) => {
    // Parse the user's credentials from the Authorization header.
    const credentials = auth(req);
  
    // If the user's credentials are available
    if (credentials) {
        // Attempt to retrieve the user by their email from the Authorization header
       await User.findOne({
            where: {
                emailAddress: credentials.name
            }               
        })
        .then( (user)=> {
            // Use the bcryptjs to compare entered password to the user's password
            if (user){
                const authenticated = bcryptjs.compareSync(credentials.pass, user.password);
                // If match user object on the stored on request object
                if (authenticated){
                    req.currentUser = user;
                    next();
                }
                // Not a match, return 401 Unauthorized HTTP status code.
                else {
                    res.status(401).end();
                }
            }
        })
    
    // If user's credentials are unavailable return 400 Bad Request HTTP status code. 
    } else {
        res.status(400);
    }
}
    

//Welcome Message
router.get('/', asyncHandler(async (req, res) =>{
    res.json({message: 'Welcome to the Courses REST API!'});
}))


//GET Currently Authorized User GET/api/users
//SELECT id, firstName, lastname, emailAddress FROM Users WHERE id = req.currentUser.id
router.get('/users', asyncHandler(authenticateUser), asyncHandler(async (req, res)=>{
    const currentUser = req.currentUser;
    User.findAll({
        attributes: ['id', 'firstName', 'lastName', 'emailAddress'],
        where: {
            id: currentUser.id
        }
    })
    .then((user) => {
        res.json({user});
    })
}))


//POST Add New User POST/api/users
//INSERT INTO Users (firstName, lastName, emailAddress, password) VALUES(...)
router.post('/users', [
    check('firstName')
        .exists()
        .withMessage('Please provide a value for "firstName"'),
    check('lastName')
        .exists()
        .withMessage('Please provide a value for "lastName"'),
    check('emailAddress')
        .exists()
        .withMessage('Please provide a value for "emailAddress"')
        .isEmail()
        .withMessage('Please enter a valid email address'),
    check('password')
        .exists()
        .withMessage('Please provide a value for "password"')

], asyncHandler(async (req, res, next)=>{

    // Get the validation result from the Request object.
    const errors = validationResult(req);

    // If there are validation errors...
    if (!errors.isEmpty()) {
        // Use the Array `map()` method to get a list of error messages.
        const errorMessages = errors.array().map(error => error.msg);

         // Return the validation errors to the client.
        res.status(400).json({ errors: errorMessages });
    } else {
        // encrypt password from the request body & create new User
        req.body.password = bcryptjs.hashSync(req.body.password);       
        await User.create(req.body)
        .then( (user) => {
            if (user){
                res.redirect("/api");
                res.status(201).end();
            } else {
                next();
            }
        })
    }
}))


//GET ALL Courses GET/api/courses
//SELECT id, userId, title, description, estimatedTime, materialsNeeded FROM Courses
router.get('/courses', asyncHandler(async(req, res)=>{
    Course.findAll({
        attributes: ['id', 'userId', 'title', 'description', 'estimatedTime', 'materialsNeeded']
    })
    .then( (courses) => {
        res.json({courses});
    })
}))


//GET Course by ID GET/api/courses/:id
//SELECT id, userId, title, description, estimatedTime, materialsNeeded FROM Courses WHERE id = req.params.id
router.get('/courses/:id', asyncHandler(async (req, res)=>{
    Course.findAll({
        attributes: ['id', 'userId', 'title', 'description', 'estimatedTime', 'materialsNeeded'],
        where: {
            id: req.params.id
        }
    })
    .then( (course) => {
        if (course){
            res.json({course});
        }
        else {
            res.status(400).end();
        }

    })
}))


//POST Add new course POST/api/courses
//INSERT INTO Courses (title, description, estimatedTime, materialsNeeded) VALUES(...)
router.post('/courses', [
    check('title')
        .exists()
        .withMessage('Please provide a value for "title"'),
    check('description')
        .exists()
        .withMessage('Please provide a value for "description"')
], asyncHandler(authenticateUser), asyncHandler(async (req, res, next)=>{
    //Declare authenticated User 
    const currentUser = req.currentUser.id;

    // Get the validation result from the Request object.
    const errors = validationResult(req);

     // If there are validation errors...
     if (!errors.isEmpty()) {
         // Use the Array `map()` method to get a list of error messages.
         const errorMessages = errors.array().map(error => error.msg);
 
          // Return the validation errors to the client.
         res.status(400).json({ errors: errorMessages });
     } else {
        // Create new course with request body
        await Course.create({ ...req.body, userId: currentUser })
        .then( (course) => {
            if (course){
                // res.redirect(`/api/courses/${course.id}`);
                res.status(201).end();
            } else {
                next();
            }
        })
     }
}))


//UPDATE course PUT/api/courses/:id
//UPDATE Courses SET ex:(materialsNeeded=materialsNeeded) WHERE id = req.parms.id
router.put('/courses/:id', [
    check('title')
        .exists()
        .withMessage('Please provide a value for "title"'),
    check('description')
        .exists()
        .withMessage('Please provide a value for "description"')
], asyncHandler(authenticateUser), asyncHandler(async (req, res, next)=>{
    //Declare authenticated User 
    const currentUser = req.currentUser.id;

    // Get the validation result from the Request object.
    const errors = validationResult(req);


    // If there are validation errors...
    if (!errors.isEmpty()) {
    // Use the Array `map()` method to get a list of error messages.
    const errorMessages = errors.array().map(error => error.msg);

        // Return the validation errors to the client.
    res.status(400).json({ errors: errorMessages });
    } else {
        await Course.findByPk(req.params.id)
        .then( (course) => {
            //If current user owns course update course
            if (currentUser === course.userId) {
                if (course){
                    course.update(req.body);
                    res.status(204).end();
                } else {
                    next();
                }
            } else {
                res.status(403).json({error: "You are not authorized to edit this course." }).end();
            }
        })
    }
}))


//DELETE course DELETE/api/courses/id
//DELETE FROM Courses WHERE id = (req.parms.id)
router.delete('/courses/:id', asyncHandler(authenticateUser), asyncHandler(async (req, res, next)=>{
    //Declare authenticated User 
    const currentUser = req.currentUser.id;

    await Course.findByPk(req.params.id)
    .then( (course) => {
         //If current user owns course update course
         if (currentUser === course.userId) {
            if (course){
                course.destroy();
                res.status(204).end();
            } else {
                next();
            }
         } else {
            res.status(403).json({error: "You are not authorized to delete this course." }).end(); 
         }
    })    
}))


module.exports = router;