const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const AppError = require('./../errorApp');
const catchAsync = require('./../utils/catchAsync');


exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Getting tour data from collection
  const tours = await Tour.find();

  // 2) Build Template(done)
  // 3) Render that template using data from 1)(done)

  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) Get data, for the request tour(including reviews and guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });

  if (!tour) {
    return next(new AppError('There Is No Tour With That Name!', 404));
  }

  // 2) Build template
  // 3) Render template using data from 1)

  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour
  });
});


exports.getLoginForm = catchAsync(async (req, res, next) => {

  res.status(200).render('login', {
    title: 'Login to your account'
  });
});

exports.getAccount = catchAsync(async (req, res, next) => {
  res.status(200).render('account', {
    title: 'Login to your account'
  });
});

exports.updateUseData = catchAsync(async (req, res, next) => {
  console.log('req body is : ', req.body);
  console.log('User body is : ', req.user);
  const updatedUser = await User.findByIdAndUpdate(req.user.id,
    {
      name: req.body.name,
      email: req.body.email
    },
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).render('account', {
    title: 'Updated Successfully!',
    user: updatedUser
  });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1) find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  // 2) Find tours with the returned
  const tourIDs = bookings.map(el => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  });
});


