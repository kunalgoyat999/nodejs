
// const fs = require('fs')
// const mongoose  = require('mongoose');
// const dotenv = require('dotenv');
// const Tour = require('./../../models/tourmodel.js');

// dotenv.config({path: './config.env'});


// const DB = process.env.DATABASE.replace(
//     '<PASSWORD>',
//  process.env.DATABASE_PASSWORD);


// mongoose.connect(DB, {
//     useNewUrlParser: true,
//     useCreateIndex: true,
//     useFindAndModify: false,
//     useUnifiedTopology: true
// }).then(() => console.log('DB Connection succesfully'));

// const tours = JSON.parse(fs.readFileSync('./4-NATOURS/starter/dev-data/data/tours.json','utf-8'));

// // Importing Data from DB

// const importData = async () => {
//     try {
//         await Tour.create(tours);
//         console.log('DATA SUCCESSFULLY LOADED')
//     }
//     catch (err) {
//         console.log(err);
//     }
//     process.exit();
// };


// // DELETING DATA FROM DB

// const deleteData = async () => {
//     try {
//         await Tour.deleteMany();
//         console.log('DATA SUCCSESSFULLY DELETED');
//     } catch (err) {
//         console.log(err);
//     }
//     process.exit();
// }

// if (process.argv[2] === '--import') {
//     importData();
// } else if (process.argv[2] === '--delete') {
//     deleteData();
// }





const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourmodel');
const Review = require('./../../models/reviewModel');
const Users = require('./../../models/userModel');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE;

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => console.log('DB connection successful!'));

// READ JSON FILE
const tours = JSON.parse(fs.readFileSync(`./dev-data/data/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`./dev-data/data/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`./dev-data/data/reviews.json`, 'utf-8')
);

// IMPORT DATA INTO DB
const importData = async () => {
  try {
    await Tour.create(tours);
    await Users.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// DELETE ALL DATA FROM DB
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await Users.deleteMany();
    await Review.deleteMany();
    console.log('Data successfully deleted!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

  
