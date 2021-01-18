
require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');

//routers
const routerLogin = require('./routers/routerLogin')(express);
const routerUsers = require('./routers/routerUsers')(express);
const routerProjects = require('./routers/routerProjects')(express);
const routerDashboard = require('./routers/routerDashboard')(express);
const routerDiscover = require('./routers/routerDiscover')(express);

//JWT
const jwt = require('jsonwebtoken');
const config = require('./jwt/jwtConfig');

//db
const { development } = require('./knexfile');
const knex = require("knex")(development);

//auth
const authClass = require('./jwt/auth')(knex);
app.use(authClass.initialize());

//port
const PORT = process.env.PORT || 8080;

//middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

//routers
app.use('/api', routerLogin);
app.use('/users', routerUsers);
app.use('/projects', routerProjects);
app.use('/dashboard', routerDashboard);
app.use('/discover', routerDiscover);

//service worker
app.get('/service-worker.js', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'build', 'service-worker.js'))
})

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}.`)
})




