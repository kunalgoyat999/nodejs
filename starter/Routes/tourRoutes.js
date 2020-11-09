const express = require('express')

const tourController = require('./../Controllers/tourController');
const authController = require('./../Controllers/authController');
const reviewController = require('./../Controllers/reviewController')

const router = express.Router();



router 
.route(`/`)
.get(tourController.getalltours)
.post(authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
    );
    
router.route('/tour-stats').get(tourController.getTourStats);

// Route for busiest specific day

router.route('/monthly-plan/:year').get(
    authController.protect, 
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getTourStats);

router.route('/tours-within/:distance/center/:latlng/unit/:unit')
.get(tourController.getTourWithin);

router
.route('/:id')
.get(tourController.getTour)

// .post(tourController.checkbody, tourController.createTour)
.post( tourController.createTour)
.patch(authController.protect, 
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour)
.delete(authController.protect, 
    authController.restrictTo('admin', 'lead-guide'),
     tourController.deleteTour);

router
.route('/:tourId/reviews')
.post(authController.protect, 
    authController.restrictTo('user'),
    reviewController.createReview);

module.exports = router;