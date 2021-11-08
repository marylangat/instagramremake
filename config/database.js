// config/database.js
const username  = 'Mary'
const password  = 'BZxn35BzacSsb.!'
const dbName    = 'instagram'

module.exports = {
    'url' : `mongodb+srv://${username}:${password}@taskmanagercluster.aqyy0.mongodb.net/${dbName}?retryWrites=true&w=majority`};
