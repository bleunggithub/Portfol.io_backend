const jwt = require('jsonwebtoken');
const config = require('../jwt/jwtConfig');

//database
const { development } = require('../knexfile');
const knex = require("knex")(development);

module.exports = (express) => {
    const router = express.Router();

    
//get projects for dashboard
router.get('/:viewing/:accessToken', async (req, res) => {
    try {
        let viewing = req.params.viewing //"Following", "Liked", "All"
        let accessToken = req.params.accessToken
        // console.trace(req.params)


        let requester = jwt.verify(accessToken, config.jwtSecret);
        
            if (viewing === "Following") {
                let followUserProjects = await knex('users_follows').where('followers_id', requester.id)
                console.trace(followUserProjects)
                
                let projects = []
                if (followUserProjects.length > 0) {
                    let mappedProjectCreatorIds = followUserProjects.map(user => user.users_id)
                    console.trace(mappedProjectCreatorIds) //Array of users_id

                    for (let i = 0; i < mappedProjectCreatorIds.length; i++){
                        projects = [...projects, ...await knex('users_projects')
                            .where('users_id', mappedProjectCreatorIds[i])
                            .select('project_id', 'users_id','project_title','project_img_url1')
                            .join('users','users_projects.users_id','=','id').select('full_name','user_img_url')]
                    }
                }
                
                //reverse order of projects, latest first
                projects = projects.sort((a,b)=>{
                    let fa = a.project_id,
                    fb = b.project_id;
                        if (fa > fb) {
                            return -1;
                        }
                        if (fa < fb) {
                            return 1;
                        }
                    return 0;
                })
                
                
                // console.trace(projects.length)

                    res.json({
                        projectDetails: projects,
                    })


            } else if (viewing === "Liked") {

                let likedProjects = await knex('users_likes').where('users_id', requester.id)
                console.trace(likedProjects)
                
                let projects = []
                if (likedProjects.length > 0) {
                    //find out id of creators of liked projects
                    //get all project data from db => then use users_projects.users_id to find infor from user

                    //project_id = likedProjects[i].project_id
                        
                    let mappedProjectIds = likedProjects.map(project => project.project_id)
                    console.trace(mappedProjectIds) //Array of project_id

                    for (let i = 0; i < mappedProjectIds.length; i++){
                        projects = [...projects, ...await knex('users_projects')
                            .where('project_id', mappedProjectIds[i])
                            .select('project_id', 'users_id','project_title','project_img_url1')
                            .join('users','users_projects.users_id','=','id').select('full_name','user_img_url')]
                    }
                }
                
                //reverse order of projects, latest first
                projects = projects.sort((a,b)=>{
                    let fa = a.project_id,
                    fb = b.project_id;
                        if (fa > fb) {
                            return -1;
                        }
                        if (fa < fb) {
                            return 1;
                        }
                    return 0;
                })
                
                
                console.trace(projects)

                    res.json({
                        projectDetails: projects,
                    })

            } else {

            }
        
        
    } catch (err) {
        console.trace(err)
        res.sendStatus(400)
    }
})


    return router; 
}