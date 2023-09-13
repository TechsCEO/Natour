const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name Is Required!']
  },
  email: {
    type: String,
    required: [true, 'Email Is Required!'],
    unique: [true, 'User With This Email Already Registered!'],
    lowercase: true,
    validate: [validator.isEmail, 'Please Provide A Valid Email!']
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  active: {
    type: Boolean,
    default: true,
    select: false
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  password: {
    type: String,
    required: [true, 'Password Is Required!'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [false, 'You Need To Confirm Your Password!'],
    validate: {
      // This ONLY works on create and save!!!
      validator: function(el) {
        return el === this.password;
      },
      message: 'Confirmation Password Does Not Match!!!'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date
});

/*userSchema.pre('save', async function(next) {
  // If Password is actually modified!
  if (!this.isModified('password')) {
    return next();
  }

  // Hash The Password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete PasswordConfirm Field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) {
    return next();
  }
  this.passwordChanedAt = Date.now() - 1000;
  next();
});*/

userSchema.pre(/^find/, function(next) {
  // "this" points to current query
  this.find({ active: { $ne: false } });
  next();
});


userSchema.methods.correctPassword = async function(password, userPassword) {
  return await bcrypt.compare(password, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimeStamp) {
  //Here 'this' always points to current document
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimeStamp < changedTimeStamp;
  }
  // False means Not Change!
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  //crypto: random byes functions from built-in crypto module


  //This is the token that we send to user, it's like reset password that the
  // user can use to create actual password that he/she wants
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + (10 * 60 * 1000);

  // resetToken: Is the one that we want to send through email to user
  return resetToken;
};


const User = mongoose.model('User', userSchema);
module.exports = User;