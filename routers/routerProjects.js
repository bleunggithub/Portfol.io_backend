const jwt = require('jsonwebtoken');
const config = require('../jwt/jwtConfig');


//database
const { development } = require('../knexfile');
const knex = require("knex")(development);

module.exports = (express) => {
    const router = express.Router();

    
//get own projects
router.post('/getOwnProjects', async (req, res) => {

    console.trace(req.body)

    let accessToken = req.body.accessToken;

    try {
        let user = jwt.verify(accessToken, config.jwtSecret);
        console.trace(user)

        let projects = await knex('users_projects').where('users_id', user.id)
            .orderBy('project_id','from', 'users_projects')

        console.trace(projects)

        res.json({
            projects
        })

            
        } catch (err) {
        console.trace(err)
        res.sendStatus(400)
}   
})
    
//get others' projects
router.get('/getOthersProjects/:profileUserId', async (req, res) => {
    try {
        let profileUserId = parseInt(req.params.profileUserId)
        console.trace(req.params.profileUserId)

        let profileUsersProjects = await knex('users_projects').where('users_id', profileUserId)
            .orderBy('project_id','from', 'users_projects')

        console.trace(profileUsersProjects)

        res.json({
            projects: profileUsersProjects
        })

            
        } catch (err) {
        console.trace(err)
        res.sendStatus(400)
        }   
    })
    
//get projects with id
router.post('/getProjectData/:projectId', async (req, res)=>{
    let projectId = parseInt(req.params.projectId); //the id of the project
    let accessToken = req.body.accessToken; // access token of requester
    console.trace(projectId)

    try {
        let requester = jwt.verify(accessToken, config.jwtSecret);

        let projectData = await knex('users_projects').where('project_id', projectId)
        let projectUserName = await knex('users').where('id', projectData[0].users_id)
        let likedUsers = await knex('users_likes').where('project_id', projectId).andWhere('users_id', requester.id)
        // console.trace(projectData)  

        if (projectData.length > 0) {
            let sameUser;
            let liked;
            let tagsArray;
            let {users_id, project_title, project_summary, project_url, project_code_url} = projectData[0]
            let users_full_name = projectUserName[0].full_name
            let project_imgs = [projectData[0].project_img_url1, projectData[0].project_img_url2, projectData[0].project_img_url3, projectData[0].project_img_url4, projectData[0].project_img_url5, projectData[0].project_img_url6]
        
            if (projectData[0].users_id === requester.id) {
                sameUser = true    
            } else {
                sameUser = false
            }
            
            if (likedUsers.length > 0) {
                liked = true
            } else {
                liked = false
            }
                
            if (projectData[0].project_tags != null) {
                tagsArray = projectData[0].project_tags.split(",")
            }
            
            res.json({
                users_id,
                users_full_name,
                project_title,
                project_imgs,
                project_summary,
                project_url,
                project_code_url,
                tagsArray,
                sameUser,
                liked
            })
            
        } else {
            res.json({
                message: 'Project not found.'
            })
        }


    } catch(err) {
        console.trace(err)
        res.sendStatus(400)
    }

})
//update project images
router.post('/editProjectImgs/:projectId', async (req, res) => {
        let projectId = parseInt(req.params.projectId); 
        let updateImgs = req.body.updateImgs; //type == array
        
        // console.trace(projectId)
        // console.trace(updateImgs)

        try {

            if (updateImgs.length > 0 && updateImgs.length <= 6){
                for (let i = 0; i < updateImgs.length; i++){
                    await knex('users_projects').update(`project_img_url${i + 1}`, updateImgs[i])
                    .where('project_id', projectId)
                }

            if (updateImgs.length < 6) {
                for (let i = 6; i > updateImgs.length; i--){
                    await knex('users_projects').update(`project_img_url${i}`, null)
                    .where('project_id', projectId)
                }
            }} else {
                res.sendStatus(400)
            }
            
            
            res.sendStatus(200)

        } catch (err) {
            console.trace(err)
            res.sendStatus(400)
        }
})
    
//update project details
router.post('/editProjectDetails/:projectId', async (req, res) => {
    let projectId = parseInt(req.params.projectId); 
    let updateDetails = req.body.projectDetails; 
    
    console.trace(projectId)
    console.trace(updateDetails)

    try {

        let requester = jwt.verify(req.body.accessToken, config.jwtSecret);
        let projectUserId = await knex('users_projects').where('project_id', projectId).returning('users_id')
        
        console.trace(requester)
        console.trace(projectUserId)

        if (projectUserId[0].users_id === requester.id) {
            
            if (updateDetails.project_title && updateDetails.project_title !== '') { 
                await knex.update('project_title', updateDetails.project_title)
                    .from('users_projects').where('project_id', projectId).returning('project_title')
                    
            }

            if (updateDetails.project_summary && updateDetails.project_summary !== '') { 
                await knex.update('project_summary', updateDetails.project_summary)
                    .from('users_projects').where('project_id', projectId).returning('project_summary')
                    
            }

            if (updateDetails.project_url && updateDetails.project_url !== '') {
                let project_url;
                let prefix = "http://";
                updateDetails.project_url.toLowerCase().includes(prefix && "https://") ?
                    (project_url = updateDetails.project_url):(project_url = prefix.concat(updateDetails.project_url))
                
                await knex.update('project_url', project_url)
                    .from('users_projects').where('project_id', projectId).returning('project_url')
                    
            }

            if (updateDetails.project_code_url && updateDetails.project_code_url !== '') { 
                let project_code_url;
                let prefix = "http://";
                updateDetails.project_code_url.toLowerCase().includes(prefix && "https://") ?
                    (project_code_url = updateDetails.project_code_url):(project_code_url = prefix.concat(updateDetails.project_code_url))
                
                await knex.update('project_code_url', project_code_url)
                    .from('users_projects').where('project_id', projectId).returning('project_code_url')
                    
            }

            if (updateDetails.project_tags && updateDetails.project_tags !== '') {
                // console.trace(updateDetails.project_tags)
                let stringTags = updateDetails.project_tags.map(x => x.skill).toString()

                // console.trace(stringTags)
                    
                await knex.update('project_tags', stringTags)
                .from('users_projects').where('project_id', projectId).returning('project_tags')
                
            } 

            if (updateDetails.imgUrls) {

                for (let i = 0; i < updateDetails.imgUrls.length; i++){
                    await knex('users_projects').update(`project_img_url${i + 1}`, updateDetails.imgUrls[i])
                    .where('project_id', projectId)
                }

                if (updateDetails.imgUrls.length < 6) {
                    for (let i = 6; i > updateDetails.imgUrls.length; i--){
                        await knex('users_projects').update(`project_img_url${i}`, null)
                        .where('project_id', projectId)
                    }
                }
            }

            res.sendStatus(200)

        } else {
            res.sendStatus(401)
        }



    } catch (err) {
        console.trace(err)
        res.sendStatus(400)
    }
})

//create new project
router.post('/addNewProject', async (req, res) => {
    console.trace(req.body.projectDetails, req.body.accessToken)

    try {
        let user = jwt.verify(req.body.accessToken, config.jwtSecret);
        console.trace(user)

        let checkNumberOfProjects = await knex('users_projects').where('users_id', user.id)
        
        //map tags
        let mappedTags = null;
        if (req.body.projectDetails.project_tags !== "") {
            mappedTags = req.body.projectDetails.project_tags.map(x => x.skill).toString()
        }
        console.trace(mappedTags)

        //add prefix to urls
        let project_url, project_code_url = null;
        let prefix = "http://";
        if (req.body.projectDetails.project_url !== "") {   
            req.body.projectDetails.project_url.toLowerCase().includes(prefix && "https://") ?
            (project_url = req.body.projectDetails.project_url):(project_url = prefix.concat(req.body.projectDetails.project_url))
        }
        
        if (req.body.projectDetails.project_code_url !== "") {   
            req.body.projectDetails.project_code_url.toLowerCase().includes(prefix && "https://") ?
            (project_code_url = req.body.projectDetails.project_code_url):(project_code_url = prefix.concat(req.body.projectDetails.project_code_url))
        }

        
        let newProjectDetails = {
            users_id: user.id,
            project_title: req.body.projectDetails.project_title,
            project_summary: req.body.projectDetails.project_summary,
            project_url: project_url,
            project_code_url: project_code_url,
            project_tags: mappedTags,
        }
        
        //map imgs
        if (req.body.projectDetails.imgUrls) {
            for (let i = 0; i < req.body.projectDetails.imgUrls.length; i++) {
                newProjectDetails["project_img_url" + `${i + 1}`] = req.body.projectDetails.imgUrls[i]
            }
        } else {
            let pictures = ["portfolio_capstone_project/placeholder_projects/markus-spiske-Skf7HxARcoc-unsplash_si7uyc",
                "portfolio_capstone_project/placeholder_projects/christopher-gower-m_HRfLhgABo-unsplash_rr24o1",
                "portfolio_capstone_project/placeholder_projects/taras-shypka-iFSvn82XfGo-unsplash_oxxz47",
                "portfolio_capstone_project/placeholder_projects/glenn-carstens-peters-npxXWgQ33ZQ-unsplash_mpehia"]

            newProjectDetails.project_img_url1 = pictures[Math.floor(Math.random()*4)]
        }
        // console.trace(newProjectDetails)

        if (checkNumberOfProjects.length >= 6) {
            // update oldest project
            let updateOldestProject = await knex.update(newProjectDetails)
                .from('users_projects')
                .where('project_id', checkNumberOfProjects[0].project_id)
                .returning('project_id')

            console.trace(updateOldestProject)

        } else {
            // add new project
            let addNewProject = await knex('users_projects')
                .insert(newProjectDetails).returning('project_id')

            console.trace(addNewProject)
        }
        res.sendStatus(200)

    } catch (err) {
        console.trace(err)
        res.sendStatus(400)
    }
})
    
//delete project
router.delete('/deleteProject/:projectId', async (req, res) => {
    let projectId = parseInt(req.params.projectId);

    try {
        let deleteProject = await knex('users_projects')
            .where('project_id', projectId).del()
            .then(res.sendStatus(200))
        
    } catch (err) {
        console.trace(err)
        res.sendStatus(400)
    }
})
    
//like project
router.post('/likeProject/:projectId', async (req, res) => {
    try {
        let projectId = parseInt(req.params.projectId);

        let user = jwt.verify(req.body.accessToken, config.jwtSecret);
    
        console.trace(projectId, user.id)

        let likeProject = await knex('users_likes')
            .where('users_id', user.id).andWhere('project_id', projectId)
        
        let liked;

        if (likeProject.length > 0) {
            //unlike
            await knex('users_likes').where('users_id', user.id)
                .andWhere('project_id', projectId).del()
            liked = false
        } else {
            //like
            await knex('users_likes').insert({
                users_id: user.id,
                project_id: projectId,
            })
            liked = true
        }
        console.trace(liked)
        res.json({liked})
        
    } catch (err) {
        console.trace(err)
        res.sendStatus(400)
    }
})

    return router; 
}