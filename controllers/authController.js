const crypto = require('crypto');
const { promisify } = require('util');
const User = require('./../models/userModel');
const AppError = require('./../errorApp');
//const sendEmail = require('./../email');
const Email = require('./../email');
const jwt = require('jsonwebtoken');
const catchAsync = require('./../utils/catchAsync');

const signToken = id => {
  // sign({ id: id } === sign({ id }, just because both of them is 'id'
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000)),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }

  // Remove the password from the output
  user.password = undefined;
  user.passwordChangedAt = undefined;

  res.cookie('jwt', token, cookieOptions);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};


exports.signUp = catchAsync(async (req, res, next) => {
  //const newUser = await User.create(req.body);
  //When we signup in website we immediately do logging
  // we need to implement that here
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log('URL Is: ', url);
  await new Email(newUser, url).sendWelcome();
  console.log('Apple Store Is Open Now!');

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  // 1) check if email and password exist
  const { email, password } = req.body;
  console.log(email, password);
  if (!email || !password) {
    return next(new AppError('Please Provide Email and Password', 400));
  }

  // 2) check if user exist && password is correct
  //User.findOne({ email: email }) === User.findOne({ email })
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect Email or Password', 401));
  }

  // 3) If Every Thing is Ok send token to client
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'logged out', {
    expires: new Date(Date.now() + (10 * 1000)),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};


exports.protect = catchAsync(async (req, res, next) => {
  // 1) Get token and check if it is there
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You Are Not Logged In, Please Log In To Get Access!', 401)
    );
  }

  // 2) Token Verification
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 3) Check if user still exits
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The User Belonging to This Token No Longer Exists!', 401));
  }

  // 4) Check if user changed the password after the jtw was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('User Recently Changed The Password, Please Login Again!', 401));
  }

  // Grant User To Access Protected Route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});


// Only for rendered pages no errors!
exports.isLoggedIn = async (req, res, next) => {
  // 1) Get token and check if it is there
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
      //const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 2) Check if user still exits
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed the password after the jtw was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // There Is A logged in user
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You Don\'t Have Permission to Perform This Action!', 403));
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user base on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There Is No user with email address', 404));
  }

  // 2) Generate the random reset token
  // validateBeforeSave: false => will deactivate all validator in user schema
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it back to user's email
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Submit a PATCH request with your
   new password and passwordConfirm to the: ${resetURL}.\n
   If you did not for get you password, Please ignore this message`;

  try {
    await new Email(user, resetURL).sendPasswordReset();
    // await sendEmail({
    //   email: user.email,
    //   subject: 'You password rest token(valid for 10 min)',
    //   message
    // });

    res.status(200).json({
      status: 'success',
      message: 'Token send to email!'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    //return next(new AppError('There was an error sending email, tray again later', 500));
    return next(new AppError(`Error Is : ${err.message}`, 500));
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2) If token has not expired, and there is user, then set new password
  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfrim = req.body.passwordConfrim;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changed password property for the user
  // 4) Login the user, send JWT
  createSendToken(user, 200, res);
});


exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  // "req.user.id" we already have our current user from protect middleware
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if posted password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  // 3) Is the password is correct, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // Keep in mind that do not use update anything related to password
  // User.findByIdAndUpdate() => 1) validator in user scheme will not work on update
  //                             2) user scheme pre middle ware only works on save functionality

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});