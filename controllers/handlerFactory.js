const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../errorApp');
const APIFeatures = require('../utils/apiFeatures');
const Tour = require('./../models/tourModel')

exports.deleteOne = Model => catchAsync(async (req, res, next) => {
  const doc = await Model.findByIdAndDelete(req.params.id);
  if (!doc) {
    return next(new AppError('No Document Found With That Id!', 404));
  }

  res.status(204).json({
    status: 'Tour successfully deleted!',
    data: doc
  });
});

exports.createOne = Model => catchAsync(async (req, res, next) => {
  // const newTour = new Tour({});
  // newTour.save();
  const newDoc = await Model.create(req.body);

  res.status(201).json({
    status: 'success',
    data: newDoc
  });
});

exports.updateOne = Model => catchAsync(async (req, res, next) => {
  const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!doc) {
    return next(new AppError('No Document Found With That Id!', 404));
  }

  res.status(200).json({
    status: 'success',
    data: doc
  });
});


exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {
  let query = Model.findById(req.params.id);
  if (popOptions) query = query.populate(popOptions);

  const doc = await query;

  if (!doc) {
    return next(new AppError('No Document Found With That ID!', 404));
  }

  res.status(200).json({
    status: 'success',
    data: doc
  });
});

exports.getAllDocs = Model => catchAsync(async (req, res, next) => {
  /*let filter = {};
  console.log('Filter Status Is : ', (!filter));
  if (req.filter){
    filter = req.filter;
  }*/
  let filter = {};
  if (req.params.tourId) {
    filter = { tour: req.params.tourId };
  }

  const features = new APIFeatures(Model.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  // const docs = await features.query.explain();
  const docs = await features.query;

  res.status(200).json({
    status: 'success',
    length: docs.length,
    data: docs
  });
});

