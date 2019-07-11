const express = require('express');
const app = express();
const router = express.Router();
const { sequelize, models } = require('./models');
const { User, Course } = models;

function asyncHandler(cb){
    return async (req,res,next) => {
        try {
            await cb(req,res,next);
        } catch(err){
            next(err);
        }
    }
}

//Welcome Message
router.get('/', async (req, res) =>{
    res.json({message: 'Welcome to the REST API Courses!'});
});


router.get('/users', async (req, res)=>{
    res.json();
})
//GET Currently Authenticated User

//GET list of courses

//GET a single course

//POST Add new course

//UPDATE course

//DELETE course

module.exports = router;