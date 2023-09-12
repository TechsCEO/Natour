const multer = require('multer');
const sharp = require('sharp');

const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../errorApp');
const handlerFactory = require('./../controllers/handlerFactory');


// C:\Users\John_Bardeen\Downloads\complete-node-bootcamp-master\complete-node-bootcamp-master\4-natours\starter\dev-data\img

/*const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/users');
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  }
});*/

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

exports.uploadUserPhoto = upload.single('photo');


exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});


const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};


exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfrim) {
    const errorMessage = 'This route is not for password updates. Please use /updateMyPassword';
    const errorCode = 400;
    return next(new AppError(errorMessage, errorCode));
  }

  // 2) Filter out unwanted fields names that are not allowed to be updated
  // Fore security that user's role does not change from "user" to "admin" we filter fields that we want
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) {
    filteredBody.photo = req.file.filename;
  }
  //const updateBody = { name: req.body.name, email: req.body.email }

  // 3) Update user document
  // If we Use user.save() then validators
  // {new: true, validators: true} => "new" is set to true so it returns the new object rather than the old one
  // {new: true, validators: true} => "validators" is set to true so mongoose to validate our documents. ex: validate input email by user

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, { new: true, runValidators: true });
  // const user = await User.findById(req.user.id);
  // user.name = "Apple Store Is Open Now!";
  // await user.save({ validateBeforeSave: false });


  res.status(200).json({
    status: 'success',
    data: {
      updatedUser
    }
  });

});

// DO NOT update passwords in this way
exports.updateUser = handlerFactory.updateOne(User);
exports.getUser = handlerFactory.getOne(User);
exports.deleteUser = handlerFactory.deleteOne(User);
exports.createUser = handlerFactory.createOne(User);
exports.getAllUsers = handlerFactory.getAllDocs(User);
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});