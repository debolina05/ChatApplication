const Sequelize = require('sequelize');


//database variable
const sequelize = new Sequelize('chat-application','root',
'root123',{
    dialect: 'mysql',
    host: 'localhost'
});


module.exports = sequelize;