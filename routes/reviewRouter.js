const express = require('express');
const reviewController = require('./../controllers/reviewControllers');
const authController = require('./../controllers/authController');


// To get access to tourRouter we need to enable "mergeParams"..
// so the url ../tours/<tour-id>/reviews and such URLs works
const router = express.Router({ mergeParams: true });

router.use(authController.protect)

router.route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserId,
    reviewController.createReview
  );

router.route('/:id')
  .get(reviewController.getReview)
  .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview)
  .delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview);

module.exports = router;