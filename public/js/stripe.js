/* eslint-disable*/
import axios from 'axios';
import { showAlert } from './alert';

const stripe = Stripe('pk_test_51Np42nHgADyUNaBMasaI68X4AmBmup9CUVaheZfJEHX6nxjmW3Hbv5xEzRgQ1c0joEy2guZDW8oLURykMrmoePMz00tP6yut4V');


export const bookTour = async tourId => {
  try {
    // 1) get session from server from api
    // const session = await axios(`http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`);
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    //console.log(session);

    // 2) Create the checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });

  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
