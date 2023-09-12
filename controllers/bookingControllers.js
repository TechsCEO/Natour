const stripe = require('stripe')('sk_test_51Np42nHgADyUNaBMpIxz8JunNfBRq2ZBUEYVP5pe5OwN9uLfrxfVcyoZg3BjoHL8se2A4u5eaJQZvFn0FHd2wD6X00HE35BWKC');
//const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const handlerFactory = require('./../controllers/handlerFactory');
const AppError = require('./../errorApp');


exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get current booked tour
  const tour = await Tour.findById(req.params.tourId);

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
    //success_url: `${req.protocol}://${req.get('host')}/`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}/`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`]
          },
          unit_amount: tour.price * 100
        },
        quantity: 1
      }
    ],
    mode: 'payment'
  });
  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session
  });

});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // This is TEMPORARY, because it's NOT Secure: everyone can make bookings without paying
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) return next();

  await Booking.create({ tour, user, price });
  res.redirect(req.originalUrl.split('?')[0]);

  //next();
});

exports.createBooking = handlerFactory.createOne(Booking)
exports.getBooking = handlerFactory.getOne(Booking)
exports.getAllBooking = handlerFactory.getAllDocs(Booking)
exports.updateBooking = handlerFactory.updateOne(Booking)
exports.deleteBooking = handlerFactory.deleteOne(Booking);

