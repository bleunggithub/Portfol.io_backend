const axios = require('axios');
const jwt = require('jsonwebtoken');
const config = require('../jwt/jwtConfig');
const bcrypt = require('./bcrypt');
const contactMe = require('../services/controllers/contactMe')


//database
const { development } = require('../knexfile');
const knex = require("knex")(development);

module.exports = (express) => {
    const router = express.Router();


//login (local)
router.post('/login', async (req, res) => {
    try {            
        console.trace(req.body.userData)
        let { email, password } = req.body.userData;
    
        let errors = [];
    
        //form validation
        if (!email || !password) {
            errors.push({
                message: "Please enter all fields."
            })
        }
    
        if (errors.length > 0) {
            res.json({
                message: errors 
            })

        }
    
        // console.trace(errors)
    
        //check if user details are the same as data in db
        let checkUser = await knex('users').where('email', email) //.andWhere('password', password);

        if (checkUser.length === 0) {
            errors.push({
                message: "The email address you entered is not registered."
            })
            res.json({
                message: errors
            })
        } else {
            //check password using bcrypt
            let passwordFromDB = await knex('users').where('email', email).returning(['password','id', 'admin']);
            let passwordResult = await bcrypt.checkPassword(password, passwordFromDB[0].password);

            // console.trace(passwordFromDB);

            //jwt
            if (passwordResult) {
            
                let payload = {
                    id: passwordFromDB[0].id 
                }

            let token = jwt.sign(payload, config.jwtSecret);

            //check if login user is admin
            let userType;
                
            if (passwordFromDB[0].admin) {
                userType = "admin"
            } else {
                userType = "user"
            }
            
            // console.trace(token, passwordFromDB[0].id, userType)
            
            //sending response to frontend
            res.json({
                token: token,
                userType: userType
                })
            } else {
                errors.push({
                    message: "Incorrect Credentials."
                })
                res.json({
                    message: errors
                })
                res.sendStatus(401);
            }

        }

    } catch (err) {
        res.sendStatus(401)
        console.trace(err)
    }
})

    

    
    
// facebook sign up /login
router.post('/login/facebook', (req, res) => {

    if (req.body) {
        let { name, email, picture, id, accessToken } = req.body;

        let pictures = ["portfolio_capstone_project/avatars/028-girl_vtg8mz","portfolio_capstone_project/avatars/003-man_mf2zrd","portfolio_capstone_project/avatars/020-delivery_man_ooolkk","portfolio_capstone_project/avatars/002-girl_skywse"]

        if (picture == '' || undefined || null) {
            picture = pictures[Math.floor(Math.random()*4)]
        }

        axios.get(`https://graph.facebook.com/me?access_token=${accessToken}`)
            .then(async(data) => {
                if (!data.data.error) {
                    let token;

                    //check if existing user
                    let findUser = await knex('users').where('facebook_id', id).returning('id')

                    if (findUser.length > 0) {
                        //update accessToken in DB
                        let updateUser = await knex('users').where('id','=',findUser[0].id).update('facebook_access_token', accessToken)

                       //jwt
                        let payload = {
                            id: findUser[0].id,
                            accessToken: accessToken
                        }; 

                        token = jwt.sign(payload, config.jwtSecret);

                        res.json({
                            token: token,
                            userType: 'user'
                        })

                    } else if (findUser.length == 0) {
                        //insert new user
                        let newFBUser = await knex('users').insert({
                            email: email,
                            facebook_id: id,
                            facebook_access_token: accessToken,
                            full_name: name,
                            user_img_url: picture,
                            admin: false
                        }).returning('id');
                        
                        console.trace(newFBUser)

                        //jwt
                        let payload = {
                            id: newFBUser[0],
                            accessToken: accessToken
                        }; 

                        token = jwt.sign(payload, config.jwtSecret);

                        res.json({
                            token: token,
                            userType: 'user' 
                        })
                    }
                } else {
                    res.sendStatus(401)
                }
            })
            .catch(err => {
                console.trace(err);
                res.sendStatus(401)
        })
    } else {
        res.sendStatus(401)
    }
})
    
// google sign up /login
router.post('/login/google', (req, res) => {

    if (req.body) {
        let { name, email, picture, id, accessToken, tokenId } = req.body;

            let pictures = ["portfolio_capstone_project/avatars/028-girl_vtg8mz","portfolio_capstone_project/avatars/003-man_mf2zrd","portfolio_capstone_project/avatars/020-delivery_man_ooolkk","portfolio_capstone_project/avatars/002-girl_skywse"]


        if (picture == '' || undefined || null) {
            picture = pictures[Math.floor(Math.random()*4)]
        }

        axios.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${tokenId}`)
            .then(async(data) => {
                if (!data.data.error) {
                    let token;

                    //check if existing user
                    let findUser = await knex('users').where('google_id', id).returning('id')

                    if (findUser.length > 0) {
                        //update accessToken in DB
                        let updateUser = await knex('users').where('id','=',findUser[0].id).update('google_access_token', accessToken)

                       //jwt
                        let payload = {
                            id: findUser[0].id,
                            accessToken: accessToken
                        }; 

                        token = jwt.sign(payload, config.jwtSecret);

                        res.json({
                            token: token,
                            userType: 'user'
                        })

                    } else if (findUser.length == 0) {
                        //insert new user
                        let newGoogleUser = await knex('users').insert({
                            email: email,
                            google_id: id,
                            google_access_token: accessToken,
                            full_name: name,
                            user_img_url: picture,
                            admin: false
                        }).returning('id');
                        
                        console.trace(newGoogleUser)

                        //jwt
                        let payload = {
                            id: newGoogleUser[0],
                            accessToken: accessToken
                        }; 

                        token = jwt.sign(payload, config.jwtSecret);

                        res.json({
                            token: token,
                            userType: 'user' 
                        })
                    }
                } else {
                    res.sendStatus(401)
                }
            })
            .catch(err => {
                console.trace(err);
                res.sendStatus(401)
        })
    } else {
        res.sendStatus(401)
    }
})

    
    //candidate register (local)
router.post('/register', async (req, res) => {
    console.trace(req.body)   
    let { fullName, email, password } = req.body;

    //form validation
    let errors = [];

    if (!email || !password || !fullName) {
        errors.push({message: "Please complete all required fields."})
    }

    if (password.length < 6) {
        errors.push({message: "Password should be at least 6 characters."})
    }

    if (errors.length > 0) {
        res.json({
            message: errors 
        });
        console.trace(errors)

    } else {
        //passed form validation, create user in db
        try {
            let query = await knex("users").where({ email: email })
            
            if (query.length > 0) {
                errors.push({ message: "The email address you entered has already been registered." })
                res.json({
                    message: errors 
                })
            } else {
                let hashedPassword = await bcrypt.hashPassword(password)
                // console.trace(hashedPassword);

                let pictures = ["portfolio_capstone_project/avatars/028-girl_vtg8mz","portfolio_capstone_project/avatars/003-man_mf2zrd","portfolio_capstone_project/avatars/020-delivery_man_ooolkk","portfolio_capstone_project/avatars/002-girl_skywse"]


                //details to be inserted in users table
                const newUser = {
                    email: email,
                    password: hashedPassword,
                    full_name: fullName,
                    user_img_url: pictures[Math.floor(Math.random()*4)],
                    admin: false,
                }

                let userId = await knex('users').insert(newUser).returning('id');
                console.trace(userId)

                //authenticate new user
                let payload = {
                    id: userId[0]
                }

                let token = jwt.sign(payload, config.jwtSecret)
                
                //sending token and id back to front end
                res.json({
                    token: token,
                    userType: 'user', 
                })
            }
            
        } catch (err) {
            console.trace(err);
            res.sendStatus(401)
        }
    }

})

    
//contact me
router.post('/contactMe', async (req, res) => {
    try {
        await contactMe.emailViaAWS_SES(req, res);
        res.json({message:"Request is sent successfully."})

    } catch (err) {
        console.trace(err)
        res.json({message:"An error has occurred. Please try again later."})
    }
})
    
    return router; 
}
