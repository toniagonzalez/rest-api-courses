const express = require('express');
const app = express();
const router = express.Router();
const { Sequelize, sequelize, models } = require('./models');
const { User, Course } = models;
const auth = require('basic-auth');
const bcryptjs = require('bcryptjs');


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

     try {
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
                        next();
                    }
                }
            })
        } 
    } catch (err) {
        res.status(401);
    }
}
    


//Welcome Message
router.get('/', asyncHandler(async (req, res) =>{
    res.json({message: 'Welcome to the Courses REST API!'});
}))


//GET Currently Authorized User GET/api/users
//SELECT * FROM Users WHERE id = req.currentUser.id
router.get('/users', authenticateUser, asyncHandler(async (req, res)=>{
    const currentUser = req.currentUser;
    User.findAll({
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
router.post('/users', asyncHandler(async (req, res, next)=>{
    console.log(req.body.password);
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
}))

//GET ALL Courses GET/api/courses
//SELECT * FROM Courses
router.get('/courses', asyncHandler(async(req, res)=>{
    Course.findAll()
    .then( (courses) => {
        res.json({courses});
    })
}))

//GET Course by ID GET/api/courses/:id
//SELECT * FROM Courses WHERE id = req.params.id
router.get('/courses/:id', asyncHandler(async (req, res)=>{
    Course.findAll({
        where: {
            id: req.params.id
        }
    })
    .then( (courses) => {
        res.json({courses});
    })
}))

//POST Add new course POST/api/courses
//INSERT INTO Courses (title, description, estimatedTime, materialsNeeded) VALUES(...)
router.post('/courses', asyncHandler(async (req, res, next)=>{
    
    await Course.create(req.body)
    .then( (course) => {
        if (course){
            res.redirect(`/api/courses/${course.id}`);
            res.status(201).end();
        } else {
            next();
        }
    })
}))

//UPDATE course PUT/api/courses/:id
//UPDATE Courses SET ex:(materialsNeeded=materialsNeeded) WHERE id = req.parms.id
router.put('/courses/:id', asyncHandler(async (req, res, next)=>{
    await Course.findByPk(req.params.id)
    .then( (course) => {
        if (course){
            course.update(req.body);
            res.status(204).end();
        } else {
            next();
        }
    })
}))

//DELETE course DELETE/api/courses/id
//DELETE FROM Courses WHERE id = (req.parms.id)
router.delete('/courses/:id', asyncHandler(async (req, res, next)=>{
    await Course.findByPk(req.params.id)
    .then( (course) => {
        if (course){
            course.destroy();
            res.status(204).end();
        } else {
            next();
        }
    })    
}))

module.exports = router;