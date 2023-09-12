const Review = require('./../models/reviewModel');
const handlerFactory = require('./../controllers/handlerFactory');
const catchAsync = require('./../utils/catchAsync');


exports.setReviewFilter = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.tourId) {
    filter = { tour: req.params.tourId };
  }
  req.filter = filter;
  next();
});

exports.setTourUserId = (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getReview = handlerFactory.getOne(Review);
exports.createReview = handlerFactory.createOne(Review);
exports.getAllReviews = handlerFactory.getAllDocs(Review);
exports.updateReview = handlerFactory.updateOne(Review);
exports.deleteReview = handlerFactory.deleteOne(Review);