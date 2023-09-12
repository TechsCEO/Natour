const Tour = require('./../models/tourModel');
const handlerFactory = require('./../controllers/handlerFactory');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../errorApp');
const APIFeatures = require('../utils/apiFeatures');
const multer = require('multer');
const sharp = require('sharp');

//const pathName = `./dev-data/data/tours.json`;
//const tours = JSON.parse(fs.readFileSync(pathName));


const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image, please upload only images!', 400), true);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);

/*upload.single('image');
upload.array('images', 5);*/


exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();


  //1) Cover Image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);


  // 2) Images
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (image, index) => {
      const imageName = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;

      await sharp(image.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${imageName}`);

      req.body.images.push(imageName);
    })
  );
  next();
});


exports.checkBodyMiddleware = (req, res, next) => {
  if (!req.body.name || !req.body.price) {
    return res.status(400).json({
      status: 'Body Needs to Contains Price and Name',
      message: 'Filed To Create New Tour!'
    });
  }
  next();
};


exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingAverage,price,';
  req.query.fields = 'name,price,ratingAverage,summary,difficulty';
  next();
};

// Void function return value is used
exports.getAllTours = handlerFactory.getAllDocs(Tour);

exports.createTour = handlerFactory.createOne(Tour);
exports.getTour = handlerFactory.getOne(Tour, { path: 'reviews' });
exports.updateTour = handlerFactory.updateOne(Tour);
exports.deleteTour = handlerFactory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {

  const stats = await Tour.aggregate([
    {
      $match: { ratingAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        //_id:  '$ratingAverage',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        averageRating: { $avg: '$ratingAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 }
    }/*,
      {
        $match: {
          _id: { $ne: 'EASY' }
        }
      }*/
  ]);
  res.status(200).json({
    status: 'success',
    data: stats
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tour: { $push: '$name' }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: { numTourStarts: -1 }
    }/*,
      {
        $limit: 6
      }*/
  ]);

  res.status(200).json({
    status: 'success',
    length: plan.length,
    data: plan
  });
});

// '/tours-within/:distance/center/:latlng/unit/:unit'
// '/tours-within/233/center/34.111745,-118.113491/unit/mi'


exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(new AppError('Please provide latitude and longitude in the format lat, long.', 400));
  }

  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius]
      }
    }
  });
  //const tours = await Tour.find({ startLocation: { $near: { $geometry: { type: 'Point', coordinates: [lng, lat] }, $minDistance: 1000, $maxDistance: 500000 } } });

  res.status(200).json({
    status: 'success',
    size: tours.length,
    data: {
      data: tours
    }
  });
});


// /distances/:latlng/unit/:unit
// '/distances/34.111745,-118.113491/unit/mi'
exports.getToursDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    next(new AppError('Please provide latitude and longitude in the format lat, long.', 400));
  }
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  const tours = await Tour.aggregate([
    {
      //$geoNear must be the first stage
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);
  //const tours = await Tour.find({ startLocation: { $near: { $geometry: { type: 'Point', coordinates: [lng, lat] }, $minDistance: 1000, $maxDistance: 500000 } } });

  res.status(200).json({
    status: 'success',
    size: tours.length,
    data: {
      data: tours
    }
  });
});

