const mongoose = require('mongoose');
const Review = require('./reviewModel');
const slugify = require('slugify');
//const User = require('./userModel')
//const validator = require('validator');

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'a tour must have a name'],
    unique: true,
    trim: true
    // it also works for updating, it shows error for white spaces also
    //validate: [validator.isAlpha, 'Tour Name must only contain character!']
  },
  slug: String,
  duration: {
    type: Number,
    unique: false,
    required: [true, 'A Tour Duration Is Required!'],
    min: [1, 'duration must be equal or above 1']
    /*validate: {
      validator: function(val) {
        return val <= 0;
      },
      message: 'duration must be equal or above 1'
    }*/
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'A Group Size Is Required']
  },
  difficulty: {
    type: String,
    required: [true, 'Tour Must Have Difficulty'],
    trim: true,
    enum: {
      values: ['easy', 'medium', 'difficult'],
      message: 'difficulty must be either: \'easy\', \'medium\' or \'difficult\''
    }
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1, 'Rating must be above 1.0'],
    max: [5, 'Rating must be below 5.0'],
    set: val => Math.round(val * 10) / 10
  }
  ,
  ratingsQuantity: {
    type: Number,
    default: 0
  }
  ,
  rating: {
    type: Number,
    default: 4.5
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price']
  },
  priceDisCount: {
    type: Number,
    validate: function(val) {
      // this only works when creating a new document not updating
      // "this" only points to current doc NEW document creation
      return val < this.price;
    }
  },
  summary: {
    type: String,
    required: [true, 'Tour Must Have Summary'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  imageCover: {
    type: String,
    required: [true, 'A tour must have image cover']
  },
  images: [String], //Array of string
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false
  },
  guides: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  ],
  startDates: [Date],
  secretTour: {
    type: Boolean,
    default: false
  },
  startLocation: {
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: [Number],
    address: String,
    description: String
  },
  // Tours <--> Locations, Few:Few, Embedded
  locations: [
    {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String,
      day: Number
    }
  ]
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

//tourSchema.index({ price: 1});
// "-1" is descending order
tourSchema.index({ price: 1, ratingsAverage: -1 }); //compound indexes
tourSchema.index({ slug: 1 }); //single field index
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Virtual population
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', // field in reviewModel
  localField: '_id'     // field in tourModel to connect to tour filed in reviewModel
});


// Aggregation Middleware
/*tourSchema.pre('aggregate', function(next) {
  this.pipeline().unshift({ $match: { difficulty: { $ne: 'easy' } } });
  next();
});*/

tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });
  next();
});

tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'reviews',
    select: '-__v -passwordChangedAt'
  });
  next();
});

const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;

/*tourSchema.pre('save', async function(next) {
  const guidesPromises = this.guides.map(async id =>  await User.findById(id));
  this.guides = await Promise.all(guidesPromises);
  next();
});*/