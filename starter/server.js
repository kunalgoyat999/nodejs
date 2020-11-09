// const MongoClient = require('mongodb').MongoClient
// const url = 'mongodb+srv://kunal:test@123@cluster0.7udz3.mongodb.net/test'

// const dbName = 'game-of-thrones'
// let db

// MongoClient.connect(url, { useNewUrlParser: true }, (err, client) => {
//   if (err) return console.log(err)

//   // Storing a reference to the database so you can use it later
//   db = client.db(dbName)
//   console.log(`Connected MongoDB: ${url}`)
//   console.log(`Database: ${dbName}`)
// })

const mongoose  = require('mongoose');

/////////
// TO add enviroment variable in console
const dotenv = require('dotenv');
/////////


/////////
//TO attach the file of config.env to server.js
/////////
dotenv.config({path: './config.env'});
// console.log(process.env)
//////////



const app = require('./app');



///////////////////////////
//Make Database in local  
///////////////////////////

//const DB = process.env.DATABASE.replace(
const DB = process.env.DATABASE;

mongoose.connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}).then( () => console.log('DB Connection succesfully '));


///////////////////////////
//Make Schema 
///////////////////////////




const port = process.env.port || 3000;
app.listen(port, () => {
    console.log(`app running on port ${port}....`)
})

