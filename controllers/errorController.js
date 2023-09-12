const AppError = require('./../errorApp');
// 401) It's for unauthorized
// 400) It's for bad request

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicationDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please Use Another Value!`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid Input Data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};
const handleInvalidTokenSignatureError = () => new AppError('Invalid Token, Please Login Again', 401);
const handleExpiredTokenError = () => new AppError('You Token Is Expired!, Please Login Again', 401);


const sendErrorDev = (req, err, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }

  // B) Rendered Website
  console.error('ERROR Is : ', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: err.message
  });

};

const sendErrorProduction = (req, err, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    // B) Programing or other unknown error: don't leak error to client
    // 1) Log error
    console.error('ERROR Is : ', err);

    // 2) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    });

  }
  // B) Rendered Website
  // A) Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message
    });
  }

  // B) Programing or other unknown error: don't leak to client
  // 1) Log error
  console.error('ERROR Is : ', err);

  // 2) Send generic message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: 'Please Try Again Later!'
  });
};


module.exports = (err, req, res, next) => {
  const errorName = err.name;
  console.log('Error Name Is : ' + err.name);
  console.log('Error Is : ' + err);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(req, err, res);
  } else if (process.env.NODE_ENV === 'production') {

    // it's not a good practice to override function parameters
    // so we need to hard copy the value
    // but for some reason it does not har copy properly
    //let error = { ...err };

    if (errorName === 'CastError') err = handleCastErrorDB(err, res);
    if (err.code === 11000) err = handleDuplicationDB(err);
    if (errorName === 'ValidationError') err = handleValidationErrorDB(err);
    if (errorName === 'JsonWebTokenError') err = handleInvalidTokenSignatureError();
    if (errorName === 'TokenExpiredError') err = handleExpiredTokenError();
    sendErrorProduction(req, err, res);
  }
};