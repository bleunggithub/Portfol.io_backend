const jwt = require('jsonwebtoken');
const config = require('../jwt/jwtConfig');
const bcrypt = require('./bcrypt');
const sendAWSEmail = require('../services/controllers/sendEmail')



//database
const { development } = require('../knexfile');
const knex = require("knex")(development);

module.exports = (express) => {
    const router = express.Router();


//get own profile 
router.post('/getOwnProfile', async (req, res) => {

    console.trace(req.body)

    let accessToken = req.body.accessToken;

    try {
        let user = jwt.verify(accessToken, config.jwtSecret);
        console.trace(user)

        let DataFromUsersTable = await knex('users').where('id', user.id).returning('*')
        let projects = await knex('users_projects').where('users_id', user.id).returning('*')

        let { email, full_name, user_img_url, location, company, job_title, github_url, facebook_url, twitter_url, linkedin_url, website_url, summary} = DataFromUsersTable[0];
            // console.trace(DataFromUsersTable[0])
        
        let facebookUser, googleUser = false;
        
        if (DataFromUsersTable[0].facebook_id != null) {
            facebookUser = true
        } else if (DataFromUsersTable[0].google_id != null) {
            googleUser = true
        }
        
        let skillsArray;
        if (DataFromUsersTable[0].skills != null) {
            skillsArray = DataFromUsersTable[0].skills.split(",")
        }
            
        res.json({
            email,
            facebookUser,
            googleUser,
            full_name,
            user_img_url,
            location,
            company,
            job_title,
            skillsArray,
            github_url,
            facebook_url,
            twitter_url,
            linkedin_url,
            website_url,
            summary,
            sameUser:true
        })

            
        } catch (err) {
        console.trace(err)
        res.sendStatus(400)
}   
})
    

//get other profile
router.post('/getProfile/:id', async (req, res) => { 

    // console.trace(req.params, req.body)
    let userId = parseInt(req.params.id); //the id of the profile
    let accessToken = req.body.accessToken; // access token of requester
    console.trace(userId)

    try {
        let requester = jwt.verify(accessToken, config.jwtSecret);
        console.trace(requester, requester.id)

        let profileUser = await knex.from('users').where('id', userId);
        console.trace(profileUser)

        if (profileUser[0]) {
            let profileUserData = await knex('users').where('id', userId);
            let following = await knex('users_follows').where('users_id', userId).andWhere('followers_id', requester.id)

            let { id, full_name, user_img_url, company, job_title, location, github_url, facebook_url, twitter_url,linkedin_url, website_url, summary} = profileUserData[0];

            let facebookUser, googleUser = false;
            
            if (profileUserData[0].facebook_id != null) {
                facebookUser = true
            } else if (profileUserData[0].google_id != null) {
                googleUser = true
            }
            let sameUser, isFollowing;

            if (userId === requester.id) {
                sameUser = true
            } else {
                sameUser = false
            }

            if (following.length > 0) {
                isFollowing = true
            } else {
                isFollowing = false
            }

            let skillsArray;
            if (profileUserData[0].skills != null) {
                skillsArray = profileUserData[0].skills.split(",")
            }

            res.json({
                id,
                full_name,
                facebookUser,
                googleUser,
                user_img_url,
                company,
                job_title,
                location,
                skillsArray,
                github_url,
                facebook_url,
                twitter_url,
                linkedin_url,
                website_url,
                summary,
                sameUser,
                isFollowing
            })

        } else {
            res.json({
                message: "The user you have requested is not found. "
            })
        }
        

    } catch (err) {
        console.trace(err)
        res.sendStatus(400)
}   

})
    

//update profile
    router.post('/updateProfile', async (req, res) => {
        console.trace(req.body.userData)
        
        try {
            let user = jwt.verify(req.body.accessToken, config.jwtSecret);
            let userId = user.id

            console.trace(userId)

            let userData = {};
            
                if(req.body.userData.user_img_url && req.body.userData.user_img_url != ''){
                    let changeProfilePicture = await knex.update('user_img_url', req.body.userData.user_img_url)
                    .from('users').where('id', '=', userId).returning('user_img_url')
                    
                    userData.user_img_url = changeProfilePicture[0]

                    console.trace(changeProfilePicture) 
                } else if (req.body.userData.summary && req.body.userData.summary != '') {
                    let changeSummary = await knex.update('summary', req.body.userData.summary)
                    .from('users').where('id', '=', userId).returning('summary')
                    console.trace(changeSummary)
                    
                    userData.summary = changeSummary[0]

                    console.trace(changeSummary) 
                } else {
                if (req.body.userData.full_name != '') {
                    let changeFullName = await knex.update('full_name', req.body.userData.full_name)
                    .from('users').where('id', '=', userId).returning('full_name')
                    
                    userData.full_name = changeFullName[0]

                    console.trace(changeFullName) 
                }

                if (req.body.userData.email != '') {
                    let checkEmail = await knex('users').where('email', req.body.userData.email)

                    if (checkEmail.length > 0) {
                        userData.errorMessage = "Email already registered."
                    } else {
                        let changeEmail = await knex.update('email', req.body.userData.email)
                        .from('users').where('id', '=', userId).returning('email')

                        userData.email = changeEmail[0]
                        console.trace(changeEmail)
                    }
                    
                } 

                if (req.body.userData.password != '') {
                    let hashedPassword = await bcrypt.hashPassword(req.body.userData.password)
                    console.trace(hashedPassword);

                    let changePassword = await knex('users').where('id', '=', userId).update({
                        'password': hashedPassword,
                    })

                    console.trace(changePassword)
                }


                if (req.body.userData.company != '') {
                    let changeCompany = await knex.update('company', req.body.userData.company)
                    .from('users').where('id', '=', userId).returning('company')
                    
                    userData.company = changeCompany[0]

                    console.trace(changeCompany) 
                } 
                
                if (req.body.userData.job_title != '') {
                    let changeJobTitle = await knex.update('job_title', req.body.userData.job_title)
                    .from('users').where('id', '=', userId).returning('job_title')

                    userData.job_title = changeJobTitle[0]

                    console.trace(changeJobTitle) 
                } 
                
                if (req.body.userData.location != '') {
                    let changeLocation = await knex.update('location', req.body.userData.location)
                    .from('users').where('id', '=', userId).returning('location')
                    
                    userData.location = changeLocation[0]

                    console.trace(changeLocation) 
                } 

                if (req.body.userData.website_url != '') {
                    let website_url;
                    let prefix = "http://"
                    req.body.userData.website_url.toLowerCase().includes(prefix && "https://") ?
                        (website_url = req.body.userData.website_url) : (website_url = prefix.concat(req.body.userData.website_url))

                    let changeWebsiteUrl = await knex.update('website_url', website_url)
                    .from('users').where('id', '=', userId).returning('website_url')
                    
                    userData.website_url = changeWebsiteUrl[0]

                    console.trace(changeWebsiteUrl) 
                } 

                if (req.body.userData.github_url != '') {
                    let github_url;
                    let prefix = "http://"
                    req.body.userData.github_url.toLowerCase().includes(prefix && "https://") ?
                        (github_url = req.body.userData.github_url) : (github_url = prefix.concat(req.body.userData.github_url))

                    let changeGithubUrl = await knex.update('github_url', github_url)
                    .from('users').where('id', '=', userId).returning('github_url')
                    
                    userData.github_url = changeGithubUrl[0]

                    console.trace(changeGithubUrl) 
                }

                if (req.body.userData.linkedin_url != '') {
                    let linkedin_url;
                    let prefix = "http://"
                    req.body.userData.linkedin_url.toLowerCase().includes(prefix && "https://") ?
                        (linkedin_url = req.body.userData.linkedin_url) : (linkedin_url = prefix.concat(req.body.userData.linkedin_url))

                    let changeLinkedinUrl = await knex.update('linkedin_url', linkedin_url)
                    .from('users').where('id', '=', userId).returning('linkedin_url')
                    
                    userData.linkedin_url = changeLinkedinUrl[0]

                    console.trace(changeLinkedinUrl) 
                } 

                if (req.body.userData.twitter_url != '') {
                    let twitter_url;
                    let prefix = "http://"
                    req.body.userData.twitter_url.toLowerCase().includes(prefix && "https://") ?
                        (twitter_url = req.body.userData.twitter_url) : (twitter_url = prefix.concat(req.body.userData.twitter_url))

                    let changeTwitterUrl = await knex.update('twitter_url', twitter_url)
                    .from('users').where('id', '=', userId).returning('twitter_url')
                    
                    userData.twitter_url = changeTwitterUrl[0]

                    console.trace(changeTwitterUrl) 
                } 

                if (req.body.userData.facebook_url != '') {
                    let facebook_url;
                    let prefix = "http://"
                    req.body.userData.facebook_url.toLowerCase().includes(prefix && "https://") ?
                        (facebook_url = req.body.userData.facebook_url) : (facebook_url = prefix.concat(req.body.userData.facebook_url))

                    let changeFacebookUrl = await knex.update('facebook_url', facebook_url)
                    .from('users').where('id', '=', userId).returning('facebook_url')
                    
                    userData.facebook_url = changeFacebookUrl[0]

                    console.trace(changeFacebookUrl) 
                } 


                
                if (req.body.userData.skills != '') {
                    // console.trace(req.body.userData.skills)
                    let mappedSkills = req.body.userData.skills.map(x => x.skill)
                    // console.trace(mappedSkills)
                    let stringSkills = mappedSkills.toString()
                    // console.trace(stringSkills)
                        
                    let changeSkills = await knex.update('skills', stringSkills)
                    .from('users').where('id', '=', userId).returning('skills')
                    
                    let skillsArray = changeSkills[0].split(",")
                    
                    userData.skillsArray = skillsArray

                    console.trace(changeSkills) 
                } 
                }

                console.trace(userData)
                res.json(userData)
            
        } catch (err) {
            console.trace(err);
            res.sendStatus(400)
        }
    })
    
    //follow/unfollow
router.post('/follow/:id', async (req, res) => {
    console.trace(req.params, req.body)
    let userId = parseInt(req.params.id); //the id of the profile
    let accessToken = req.body.accessToken; // access token of requester
    console.trace(userId)

    try {
        let requester = jwt.verify(accessToken, config.jwtSecret);
        console.trace(requester, requester.id)

        let checkFollowing = await knex.from('users_follows').where('users_id',userId).andWhere('followers_id',requester.id)
        
        let isFollowing;

        if (checkFollowing.length > 0) {
            //unfollow
            await knex('users_follows').where('users_id', userId).andWhere('followers_id', requester.id).del()

            isFollowing = false;
        } else {
            //follow
            await knex('users_follows').insert({
                users_id: userId,
                followers_id: requester.id,
            })

            isFollowing = true;
        }

        console.trace(isFollowing)

        res.json({isFollowing})

        

        } catch (err) {
            console.trace(err)
            res.sendStatus(400)
    }   
    })


//send email
router.post('/sendEmail', async (req, res) => {
    try {
        await sendAWSEmail.emailViaAWS_SES(req, res);
        res.json({message:"Request is sent successfully."})

    } catch (err) {
        console.trace(err)
        res.json({message:"An error has occurred. Please try again later."})
    }
})
    
    

    return router; 
}