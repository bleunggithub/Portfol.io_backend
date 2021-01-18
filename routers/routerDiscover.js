const jwt = require('jsonwebtoken');
const config = require('../jwt/jwtConfig');

//database
const { development } = require('../knexfile');
const knex = require("knex")(development);

module.exports = (express) => {
    const router = express.Router();

    
//get projects for dashboard
router.get('/getAll', async (req, res) => {
    try {

        let allProjects = await knex('users_projects')
            .select('project_id', 'users_id', 'project_title', 'project_img_url1')
            .join('users', 'users_projects.users_id', '=', 'id').select('full_name', 'user_img_url')
            .orderBy('project_id', 'desc')

        console.trace(allProjects)

        res.json({
            projectDetails: allProjects,
        })

    } catch (err) {
        console.trace(err)
        res.sendStatus(400)
    }
})
    
//get projects for landing page
router.get('/get12', async (req, res) => {
    try {

        let projects = await knex('users_projects')
            .select('project_id', 'users_id', 'project_title', 'project_img_url1')
            .join('users', 'users_projects.users_id', '=', 'id').select('full_name', 'user_img_url')
            .limit(12).orderBy('project_id', 'desc')

        console.trace(projects)

        res.json({
            projectDetails: projects,
        })

    } catch (err) {
        console.trace(err)
        res.sendStatus(400)
    }
})
    
    
router.post('/search', async (req, res) => {
    try {
        let searchKeywords = req.body.searchKeywords;
        let keywords=[];
            if (searchKeywords.includes(" "&&'"')) {
                keywords.push(searchKeywords.replace(/"/g,"").toLowerCase())
            } else if (searchKeywords.includes(' ')) {
                keywords = searchKeywords.toLowerCase().split(" ")
            } else {
            keywords.push(searchKeywords)
            }
        
        let keywordSearchResults = [];

        if (keywords.length > 1) {
            for (let i = 0; i < keywords.length; i++){

                let keywordSearchProjects = await knex('users_projects').where(knex.raw('LOWER("project_title")'), 'LIKE', `%${keywords[i]}%`)
                    .orWhere(knex.raw('LOWER("project_summary")'), 'LIKE', `%${keywords[i]}%`)
                    .orWhere(knex.raw('LOWER("project_tags")'), 'LIKE', `%${keywords[i]}%`)
                    .select('users_id', 'project_id', 'project_title', 'project_img_url1')
                    .join('users','users_projects.users_id','=','id').select('full_name','user_img_url')
                
                    keywordSearchResults = [...keywordSearchResults, ...keywordSearchProjects]
            }
        } else {

            let keywordSearchProjects = await knex('users_projects').where(knex.raw('LOWER("project_title")'), 'LIKE', `%${keywords[0]}%`)
                .orWhere(knex.raw('LOWER("project_summary")'), 'LIKE', `%${keywords[0]}%`)
                .orWhere(knex.raw('LOWER("project_tags")'), 'LIKE', `%${keywords[0]}%`)
                .select('users_id', 'project_id', 'project_title', 'project_img_url1')
                .join('users','users_projects.users_id','=','id').select('full_name','user_img_url')
            
                keywordSearchResults = keywordSearchProjects
        }

        console.trace(keywordSearchResults)

        res.json({
            searchResults: keywordSearchResults
        })


    } catch (err){
        console.trace(err)
        res.sendStatus(400)
    } 
})

    
    

    return router; 
}