const dotenv = require('dotenv'); //dotenv

process.on('uncaughtException', err => {
  console.log(err.name + ' : ', err.message);
  process.exit(0);
});

const mongoose = require('mongoose');
dotenv.config({ path: './config.env' });
const app = require('./app');

const port = process.env.PORT || 3000;
// mongodb+srv://natourDB:<Gk9UjPRGhEil1CZ8>@cluster0.3yxwx4l.mongodb.net/


//const mongoDbUrl = 'mongodb+srv://natourDB:Gk9UjPRGhEil1CZ8@cluster0.3yxwx4l.mongodb.net/?retryWrites=true&w=majority';
//const mongoDbUrl = 'mongodb+srv://natourDB:kG9UjPRGhEil1CZ8@cluster0.3yxwx4l.mongodb.net/?retryWrites=true&w=majority';
const mongoDbUrl = 'mongodb://0.0.0.0/tours-test';
//const offlineUrl = 'mongodb://localhost:27017/tour

mongoose.connect(mongoDbUrl/*, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false
}*/).then(con => {
  console.log('Connected Successfully!');
});


const server = app.listen(port, () => {
  console.log(`App Running on port ${port}...`);
});

// If we have problem like database connection we better shutdown our application
// It kinda is central place to handle promise(unhandledRejection) errors
// It Handles all the promise that causes error
process.on('unhandledRejection', err => {
  console.log(`Error Name Is : ${err.name}\nError Message Is : ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});
// PassCode 0(Zero) is for success
// PassCode 1(One) is for unCall exception