const fs = require('fs');
const mongoose = require('mongoose');
//const Tour = require('models/tourModel');
//const Tour = require('models/tourModel');
const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');

const port = 3000;
//const mongoDbUrl = 'mongodb+srv://natourDB:Gk9UjPRGhEil1CZ8@cluster0.3yxwx4l.mongodb.net/?retryWrites=true&w=majority';
const mongoDbUrl = 'mongodb://0.0.0.0/tours-test';

mongoose.connect(mongoDbUrl/*, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false
}*/).then(con => {
  console.log('Connected Successfully!');
  //console.log(con.connections);
});

// READ JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('data successfully uploaded!');
  } catch (err) {
    console.log('Importing data error is :', err);
  }
  process.exit();
};

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('data successfully Deleted!');
  } catch (err) {
    console.log('Deleting data error is :', err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}






