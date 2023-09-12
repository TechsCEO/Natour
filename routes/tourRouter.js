const express = require('express');
//const { checkBodyMiddleware } = require('./../controllers/tourControllers');
const controller = require('./../controllers/tourControllers');
const authController = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRouter');
//const reviewController = require('../controllers/reviewControllers');

const router = express.Router();

router.use('/:tourId/reviews', reviewRouter);

router.route('/tour-stats').get(controller.getTourStats);

router
  .route('/:id')
  .get(controller.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    controller.uploadTourImages,
    controller.resizeTourImages,
    controller.updateTour
  )
  .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), controller.deleteTour);

router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(controller.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(controller.getToursDistances);

router.route('/')
  .get(controller.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    controller.createTour
  );

router.route('/top-5-tours')
  .get(
    controller.aliasTopTours,
    controller.getAllTours
  );
router.route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    controller.getMonthlyPlan
  );


module.exports = router;
/* checkBodyMiddleware, */
